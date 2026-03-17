import logging

from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from apps.notifications.email import send_email
from datetime import timedelta

from apps.users.permissions import IsTicketManager
from apps.reservations.models import Reservation
from .models import Cinema, Room, Movie, Showtime
from .serializers import (
    CinemaSerializer, RoomSerializer, RoomDetailSerializer,
    MovieSerializer, MovieListSerializer,
    ShowtimeSerializer, ShowtimeDetailSerializer, ShowtimeCalendarSerializer,
)

logger = logging.getLogger(__name__)


class CinemaViewSet(viewsets.ModelViewSet):
    # public browsing, only managers can create/edit
    serializer_class = CinemaSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'city', 'address']
    ordering_fields = ['name', 'city', 'created_at']
    filterset_fields = ['city', 'is_active']

    def get_queryset(self):
        # if manager/admin, show everything (to manage inactive ones)
        # otherwise only active
        if self.request.user.is_authenticated and self.request.user.can_manage_venues:
            return Cinema.objects.all()
        return Cinema.objects.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTicketManager()]

    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        cinema = self.get_object()
        rooms = cinema.rooms.filter(is_active=True)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def showtimes(self, request, pk=None):
        cinema = self.get_object()
        showtimes = Showtime.objects.filter(
            room__cinema=cinema, is_active=True,
            start_time__gte=timezone.now()
        ).select_related('movie', 'room')
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)


class RoomViewSet(viewsets.ModelViewSet):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'cinema__name']
    ordering_fields = ['name', 'capacity', 'created_at']
    filterset_fields = ['cinema', 'room_type', 'is_active']

    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.can_manage_venues:
            return Room.objects.all().select_related('cinema')
        return Room.objects.filter(is_active=True).select_related('cinema')

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return RoomDetailSerializer
        return RoomSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'room_types']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTicketManager()]

    @action(detail=False, methods=['get'], url_path='room-types')
    def room_types(self, request):
        choices = [{'value': k, 'label': str(v)} for k, v in Room.RoomType.choices]
        return Response({'results': choices})


class MovieViewSet(viewsets.ModelViewSet):
    queryset = Movie.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'original_title', 'director', 'genre']
    ordering_fields = ['title', 'release_date', 'duration_minutes', 'created_at']
    filterset_fields = ['genre', 'rating', 'is_active']

    def get_serializer_class(self):
        if self.action == 'list':
            return MovieListSerializer
        return MovieSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'rating_options']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTicketManager()]

    def get_queryset(self):
        if self.action == 'list':
            if not self.request.user.is_authenticated or not self.request.user.can_manage_venues:
                return Movie.objects.filter(is_active=True)
        return Movie.objects.all()

    @action(detail=False, methods=['get'], url_path='rating-options')
    def rating_options(self, request):
        choices = [{'value': k, 'label': str(v)} for k, v in Movie.Rating.choices]
        return Response({'results': choices})

    @action(detail=True, methods=['get'])
    def showtimes(self, request, pk=None):
        movie = self.get_object()
        showtimes = movie.showtimes.filter(
            is_active=True, start_time__gte=timezone.now()
        ).select_related('room', 'room__cinema')
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)


class ShowtimeViewSet(viewsets.ModelViewSet):
    queryset = Showtime.objects.select_related('movie', 'room', 'room__cinema')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['movie__title', 'room__name', 'room__cinema__name']
    ordering_fields = ['start_time', 'price', 'available_seats']
    filterset_fields = ['movie', 'room', 'room__cinema', 'is_3d', 'is_imax', 'is_active']

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return ShowtimeDetailSerializer
        if self.action == 'calendar':
            return ShowtimeCalendarSerializer
        return ShowtimeSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'calendar', 'today', 'upcoming']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTicketManager()]

    def get_queryset(self):
        queryset = super().get_queryset()
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(start_time__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(start_time__date__lte=date_to)
        return queryset

    def _get_affected_reservations(self, showtime):
        return Reservation.objects.filter(
            showtime=showtime,
            status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING],
            showtime__start_time__gte=timezone.now(),
        ).select_related('user', 'showtime__movie', 'showtime__room', 'showtime__room__cinema')

    def _send_notifications(self, reservations, reason):
        for reservation in reservations:
            subject = f"Αλλαγη στην κρατηση σας - {reservation.showtime.movie.title}"
            text = (
                f"Αγαπητε/η {reservation.user.get_full_name()},\n\n"
                f"Η κρατηση σας για την ταινια "
                f"«{reservation.showtime.movie.title}» στις "
                f"{reservation.showtime.start_time:%d/%m/%Y %H:%M} "
                f"εχει επηρεαστει.\n\n"
                f"Αιτια: {reason}\n\n"
                f"Κωδικος κρατησης: {reservation.id}\n\n"
                f"Παρακαλω επικοινωνηστε μαζι μας για περισσοτερες "
                f"πληροφοριες η για επαναπρογραμματισμο.\n\n"
                f"Ευχαριστουμε."
            )
            html = (
                f"<p>Αγαπητε/η {reservation.user.get_full_name()},</p>"
                f"<p>Η κρατηση σας για την ταινια "
                f"«{reservation.showtime.movie.title}» στις "
                f"{reservation.showtime.start_time:%d/%m/%Y %H:%M} "
                f"εχει επηρεαστει.</p>"
                f"<p><strong>Αιτια:</strong> {reason}</p>"
                f"<p><strong>Κωδικος κρατησης:</strong> {reservation.id}</p>"
                f"<p>Παρακαλω επικοινωνηστε μαζι μας για περισσοτερες "
                f"πληροφοριες η για επαναπρογραμματισμο.</p>"
                f"<p>Ευχαριστουμε.</p>"
            )
            if not send_email(to=reservation.user.email, subject=subject, html=html, text=text):
                logger.warning("Failed to send notification to %s", reservation.user.email)

    def _figure_out_changes(self, old_showtime, new_data):
        changes = []
        if 'start_time' in new_data and str(old_showtime.start_time) != str(new_data['start_time']):
            changes.append("αλλαγη ωρας προβολης")
        if 'room' in new_data and str(old_showtime.room_id) != str(new_data['room']):
            changes.append("αλλαγη αιθουσας")
        if 'movie' in new_data and str(old_showtime.movie_id) != str(new_data['movie']):
            changes.append("αλλαγη ταινιας")
        if 'price' in new_data and old_showtime.price != new_data['price']:
            changes.append("αλλαγη τιμης")
        if 'is_active' in new_data and old_showtime.is_active and not new_data['is_active']:
            changes.append("ακυρωση προβολης")
        if 'available_seats' in new_data:
            if new_data['available_seats'] < old_showtime.available_seats:
                changes.append("μειωση διαθεσιμων θεσεων")
        return ', '.join(changes) if changes else ''

    def update(self, request, *args, **kwargs):
        showtime = self.get_object()
        reason = self._figure_out_changes(showtime, request.data)
        response = super().update(request, *args, **kwargs)
        if reason:
            affected = self._get_affected_reservations(showtime)
            if affected.exists():
                self._send_notifications(affected, reason)
        return response

    def partial_update(self, request, *args, **kwargs):
        showtime = self.get_object()
        reason = self._figure_out_changes(showtime, request.data)
        response = super().partial_update(request, *args, **kwargs)
        if reason:
            affected = self._get_affected_reservations(showtime)
            if affected.exists():
                self._send_notifications(affected, reason)
        return response

    def destroy(self, request, *args, **kwargs):
        showtime = self.get_object()
        affected = list(self._get_affected_reservations(showtime))
        if affected:
            reason = f"Η προβολη «{showtime.movie.title}» στις {showtime.start_time:%d/%m/%Y %H:%M} διαγραφηκε"
            self._send_notifications(affected, reason)
            for reservation in affected:
                reservation.cancel(changed_by=request.user, notes='Showtime removed by manager')
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def calendar(self, request):
        showtimes = self.get_queryset().filter(is_active=True, start_time__gte=timezone.now())
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        now = timezone.now()
        showtimes = self.get_queryset().filter(
            is_active=True, start_time__date=now.date(), start_time__gte=now
        )
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        showtimes = self.get_queryset().filter(
            is_active=True, start_time__gte=now,
            start_time__lte=now + timedelta(days=7)
        )
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)

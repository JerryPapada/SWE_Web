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
    ShowtimeSeatSerializer,
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
        if self.action in ['list', 'retrieve', 'rooms', 'showtimes']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTicketManager()]

    @extend_schema(summary="List rooms in a cinema", responses={200: RoomSerializer(many=True)})
    @action(detail=True, methods=['get'])
    def rooms(self, request, pk=None):
        cinema = self.get_object()
        rooms = cinema.rooms.filter(is_active=True)
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)

    @extend_schema(summary="List upcoming showtimes in a cinema", responses={200: ShowtimeCalendarSerializer(many=True)})
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

    @extend_schema(summary="List available room types", responses={200: OpenApiTypes.OBJECT})
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
        if self.action in ['list', 'retrieve', 'rating_options', 'genre_options', 'showtimes']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsTicketManager()]

    def get_queryset(self):
        if self.action == 'list':
            if not self.request.user.is_authenticated or not self.request.user.can_manage_venues:
                return Movie.objects.filter(is_active=True)
        return Movie.objects.all()

    @extend_schema(summary="List movie rating options", responses={200: OpenApiTypes.OBJECT})
    @action(detail=False, methods=['get'], url_path='rating-options')
    def rating_options(self, request):
        choices = [{'value': k, 'label': str(v)} for k, v in Movie.Rating.choices]
        return Response({'results': choices})

    @extend_schema(summary="List movie genre options", responses={200: OpenApiTypes.OBJECT})
    @action(detail=False, methods=['get'], url_path='genre-options')
    def genre_options(self, request):
        choices = [{'value': k, 'label': str(v)} for k, v in Movie.Genre.choices]
        return Response({'results': choices})

    @extend_schema(summary="List upcoming showtimes for a movie", responses={200: ShowtimeCalendarSerializer(many=True)})
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
        if self.action in ['list', 'retrieve', 'calendar', 'today', 'upcoming', 'seats']:
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
        return queryset.order_by('start_time', 'movie__title', 'room__name')

    @extend_schema(summary="List seats for a showtime", responses={200: ShowtimeSeatSerializer(many=True)})
    @action(detail=True, methods=['get'])
    def seats(self, request, pk=None):
        showtime = self.get_object()
        seats = showtime.seats.all()
        serializer = ShowtimeSeatSerializer(seats, many=True)
        return Response(serializer.data)

    def _get_affected_reservations(self, showtime):
        return Reservation.objects.filter(
            showtime=showtime,
            status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING],
            showtime__start_time__gte=timezone.now(),
        ).select_related('user', 'showtime__movie', 'showtime__room', 'showtime__room__cinema')

    def _send_notifications(self, reservations, reason):
        for reservation in reservations:
            recipients = [reservation.user.email]
            if reservation.guest_email:
                recipients.append(reservation.guest_email)
            recipients = list(dict.fromkeys(recipients))

            subject = f"Change in your reservation - {reservation.showtime.movie.title}"
            text = (
                f"Dear {reservation.user.get_full_name()},\n\n"
                f"Your reservation for the movie "
                f"«{reservation.showtime.movie.title}» on "
                f"{reservation.showtime.start_time:%d/%m/%Y %H:%M} "
                f"has been affected.\n\n"
                f"Reason: {reason}\n\n"
                f"Reservation ID: {reservation.id}\n\n"
                f"Please contact us for more information or to reschedule.\n\n"
                f"Thank you."
            )
            html = (
                f"<p>Dear {reservation.user.get_full_name()},</p>"
                f"<p>Your reservation for the movie "
                f"«{reservation.showtime.movie.title}» on "
                f"{reservation.showtime.start_time:%d/%m/%Y %H:%M} "
                f"has been affected.</p>"
                f"<p><strong>Reason:</strong> {reason}</p>"
                f"<p><strong>Reservation ID:</strong> {reservation.id}</p>"
                f"<p>Please contact us for more information or to reschedule.</p>"
                f"<p>Thank you.</p>"
            )
            if not send_email(to=recipients, subject=subject, html=html, text=text):
                logger.warning("Failed to send notification to %s", recipients)

    def _format_time_change_reason(self, old_time, new_time):
        return (
            "change in showtime "
            f"({old_time:%d/%m/%Y %H:%M} -> {new_time:%d/%m/%Y %H:%M})"
        )

    def _figure_out_changes(self, old_showtime, new_data):
        changes = []
        if 'start_time' in new_data and str(old_showtime.start_time) != str(new_data['start_time']):
            changes.append("change in showtime")
        if 'room' in new_data and str(old_showtime.room_id) != str(new_data['room']):
            changes.append("change in room")
        if 'movie' in new_data and str(old_showtime.movie_id) != str(new_data['movie']):
            changes.append("change in movie")
        if 'price' in new_data and old_showtime.price != new_data['price']:
            changes.append("change in price")
        if 'is_active' in new_data and old_showtime.is_active and not new_data['is_active']:
            changes.append("change in active status")
        if 'available_seats' in new_data:
            if new_data['available_seats'] < old_showtime.available_seats:
                changes.append("change in available seats")
        return ', '.join(changes) if changes else ''

    def update(self, request, *args, **kwargs):
        showtime = self.get_object()
        old_start_time = showtime.start_time
        reason = self._figure_out_changes(showtime, request.data)
        response = super().update(request, *args, **kwargs)
        showtime.refresh_from_db()

        if showtime.start_time != old_start_time:
            time_reason = self._format_time_change_reason(old_start_time, showtime.start_time)
            reason = f"{time_reason}, {reason}" if reason else time_reason
        if reason:
            affected = self._get_affected_reservations(showtime)
            if affected.exists():
                self._send_notifications(affected, reason)
        return response

    def partial_update(self, request, *args, **kwargs):
        showtime = self.get_object()
        old_start_time = showtime.start_time
        reason = self._figure_out_changes(showtime, request.data)
        response = super().partial_update(request, *args, **kwargs)
        showtime.refresh_from_db()

        if showtime.start_time != old_start_time:
            time_reason = self._format_time_change_reason(old_start_time, showtime.start_time)
            reason = f"{time_reason}, {reason}" if reason else time_reason
        if reason:
            affected = self._get_affected_reservations(showtime)
            if affected.exists():
                self._send_notifications(affected, reason)
        return response

    def destroy(self, request, *args, **kwargs):
        showtime = self.get_object()
        affected = list(self._get_affected_reservations(showtime))
        if affected:
            reason = f"The showtime for «{showtime.movie.title}» on {showtime.start_time:%d/%m/%Y %H:%M} has been removed."
            self._send_notifications(affected, reason)
            for reservation in affected:
                reservation.cancel(changed_by=request.user, notes='Showtime removed by manager')
        return super().destroy(request, *args, **kwargs)

    @extend_schema(summary="Get showtime calendar", responses={200: ShowtimeCalendarSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def calendar(self, request):
        showtimes = self.get_queryset().filter(is_active=True, start_time__gte=timezone.now())
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)

    @extend_schema(summary="Get today's showtimes", responses={200: ShowtimeCalendarSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def today(self, request):
        now = timezone.now()
        showtimes = self.get_queryset().filter(
            is_active=True, start_time__date=now.date(), start_time__gte=now
        )
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)

    @extend_schema(summary="Get upcoming showtimes (next 7 days)", responses={200: ShowtimeCalendarSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        now = timezone.now()
        showtimes = self.get_queryset().filter(
            is_active=True, start_time__gte=now,
            start_time__lte=now + timedelta(days=7)
        )
        serializer = ShowtimeCalendarSerializer(showtimes, many=True)
        return Response(serializer.data)

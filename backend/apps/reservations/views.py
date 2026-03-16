from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Count, Sum
from django.utils import timezone

from apps.users.permissions import IsAdmin, IsTicketManager, IsOwnerOrAdmin
from .models import Reservation
from .serializers import (
    ReservationHistorySerializer,
    ReservationSerializer,
    ReservationCreateSerializer,
    ReservationDetailSerializer,
    MyReservationsSerializer,
)


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.select_related(
        'user', 'showtime', 'showtime__movie',
        'showtime__room', 'showtime__room__cinema'
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__email', 'showtime__movie__title', 'id']
    ordering_fields = ['created_at', 'showtime__start_time', 'status']
    filterset_fields = ['status', 'showtime', 'showtime__movie', 'showtime__room__cinema']

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        if self.action == 'retrieve':
            return ReservationDetailSerializer
        if self.action == 'my_reservations':
            return MyReservationsSerializer
        if self.action == 'history':
            return ReservationHistorySerializer
        return ReservationSerializer

    def get_permissions(self):
        if self.action in ['create', 'my_reservations']:
            return [permissions.IsAuthenticated()]
        if self.action == 'statistics':
            return [permissions.IsAuthenticated(), IsAdmin()]
        if self.action == 'list':
            return [permissions.IsAuthenticated(), IsTicketManager()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()

        if not self.request.user.can_manage_venues:
            queryset = queryset.filter(user=self.request.user)

        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(showtime__start_time__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(showtime__start_time__date__lte=date_to)

        return queryset

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        reservations = self.get_queryset().filter(user=request.user)

        status_filter = request.query_params.get('status')
        if status_filter:
            reservations = reservations.filter(status=status_filter)

        time_filter = request.query_params.get('time')
        if time_filter == 'upcoming':
            reservations = reservations.filter(showtime__start_time__gte=timezone.now())
        elif time_filter == 'past':
            reservations = reservations.filter(showtime__start_time__lt=timezone.now())

        serializer = MyReservationsSerializer(reservations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()

        if reservation.status == Reservation.Status.CANCELLED:
            return Response(
                {'error': 'Reservation is already cancelled.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reservation.status == Reservation.Status.COMPLETED:
            return Response(
                {'error': 'Cannot cancel a completed reservation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if reservation.showtime.start_time <= timezone.now():
            return Response(
                {'error': 'Cannot cancel past reservations.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.cancel(changed_by=request.user, notes='Cancelled from API')
        return Response({'message': 'Reservation cancelled successfully.'})

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        reservation = self.get_object()
        history = reservation.history.select_related('changed_by')
        serializer = self.get_serializer(history, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='admin/statistics')
    def statistics(self, request):
        now = timezone.now()
        base_qs = Reservation.objects.all()
        confirmed_qs = base_qs.filter(status=Reservation.Status.CONFIRMED)

        status_rows = base_qs.values('status').annotate(total=Count('id')).order_by('status')
        by_status = {row['status']: row['total'] for row in status_rows}

        revenue = confirmed_qs.aggregate(total=Sum('total_price'))['total'] or 0
        total_seats_reserved = confirmed_qs.aggregate(total=Sum('num_seats'))['total'] or 0

        return Response({
            'total_reservations': base_qs.count(),
            'by_status': by_status,
            'confirmed_revenue': revenue,
            'confirmed_seats': total_seats_reserved,
            'upcoming_reservations': base_qs.filter(showtime__start_time__gte=now).count(),
            'past_reservations': base_qs.filter(showtime__start_time__lt=now).count(),
        })

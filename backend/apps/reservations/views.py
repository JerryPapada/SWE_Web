from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone

from apps.users.permissions import IsTicketManager, IsOwnerOrAdmin
from .models import Reservation
from .serializers import (
    ReservationSerializer,
    ReservationCreateSerializer,
    ReservationDetailSerializer,
    MyReservationsSerializer,
)


class ReservationViewSet(viewsets.ModelViewSet):
    # handles user reservations - regular users only see their own,
    # managers can see everything

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
        return ReservationSerializer

    def get_permissions(self):
        if self.action in ['create', 'my_reservations']:
            return [permissions.IsAuthenticated()]
        if self.action == 'list':
            return [permissions.IsAuthenticated(), IsTicketManager()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def get_queryset(self):
        qs = super().get_queryset()

        # regular users only see their own stuff
        if not self.request.user.can_manage_venues:
            qs = qs.filter(user=self.request.user)

        # optional date range filtering
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(showtime__start_time__date__gte=date_from)
        if date_to:
            qs = qs.filter(showtime__start_time__date__lte=date_to)

        return qs

    @action(detail=False, methods=['get'])
    def my_reservations(self, request):
        reservations = self.get_queryset().filter(user=request.user)

        # filter by status if provided
        st = request.query_params.get('status')
        if st:
            reservations = reservations.filter(status=st)

        # upcoming vs past
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

        reservation.cancel()
        return Response({'message': 'Reservation cancelled successfully.'})

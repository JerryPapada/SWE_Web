from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db import models
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes

from apps.users.permissions import IsTicketManager
from apps.reservations.models import Reservation
from .models import Ticket, VisitorLog
from .serializers import (
    TicketSerializer, TicketValidationSerializer, TicketCheckInSerializer,
    VisitorLogSerializer, VisitorRegistrationSerializer, VisitorSearchSerializer,
)


class TicketViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Ticket.objects.select_related(
        'reservation', 'reservation__user',
        'reservation__showtime', 'reservation__showtime__movie',
        'reservation__showtime__room', 'reservation__showtime__room__cinema'
    )
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['reservation__user__email', 'reservation__showtime__movie__title']
    ordering_fields = ['created_at', 'reservation__showtime__start_time']
    filterset_fields = ['status', 'checked_in', 'reservation__showtime']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.can_manage_venues:
            queryset = queryset.filter(reservation__user=self.request.user)
        return queryset

    @extend_schema(summary="Get current user's valid tickets", responses={200: TicketSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        tickets = self.get_queryset().filter(
            reservation__user=request.user,
            status=Ticket.Status.VALID
        )
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get all tickets for a user",
        description="Returns all tickets associated with a specific user ID. Managers can see any user's tickets, regular users only their own.",
        responses={200: TicketSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_tickets(self, request, user_id=None):
        tickets = self.get_queryset().filter(reservation__user_id=user_id)
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)

    @extend_schema(
        summary="Get user tickets for a specific day",
        description="Returns all tickets for a user on a given date (YYYY-MM-DD).",
        responses={200: TicketSerializer(many=True)}
    )
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)/(?P<day>[^/.]+)')
    def user_tickets_by_day(self, request, user_id=None, day=None):
        tickets = self.get_queryset().filter(
            reservation__user_id=user_id,
            reservation__showtime__start_time__date=day
        )
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)


class TicketValidationView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTicketManager]

    @extend_schema(request=TicketValidationSerializer,
                   responses={200: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = TicketValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        ticket = Ticket.validate_qr(serializer.validated_data['qr_data'])
        if not ticket:
            return Response({'valid': False, 'error': 'Invalid QR code.'},
                            status=status.HTTP_404_NOT_FOUND)

        return Response({
            'valid': True,
            'ticket': TicketSerializer(ticket).data,
            'can_check_in': ticket.status == Ticket.Status.VALID and not ticket.checked_in
        })


class TicketCheckInView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsTicketManager]

    @extend_schema(request=TicketCheckInSerializer,
                   responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT,
                              404: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = TicketCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        qr_data = serializer.validated_data.get('qr_data')
        ticket_id = serializer.validated_data.get('ticket_id')

        ticket = None
        if qr_data:
            ticket = Ticket.validate_qr(qr_data)
        elif ticket_id:
            try:
                ticket = Ticket.objects.get(id=ticket_id)
            except Ticket.DoesNotExist:
                pass

        if not ticket:
            return Response({'success': False, 'error': 'Ticket not found.'},
                            status=status.HTTP_404_NOT_FOUND)

        ok, msg = ticket.check_in(staff_user=request.user)
        if not ok:
            return Response({'success': False, 'error': msg},
                            status=status.HTTP_400_BAD_REQUEST)

        VisitorLog.objects.create(
            ticket=ticket,
            first_name=ticket.reservation.user.first_name,
            last_name=ticket.reservation.user.last_name,
            phone=ticket.reservation.user.phone,
            email=ticket.reservation.user.email,
            showtime=ticket.reservation.showtime,
            logged_by=request.user
        )

        return Response({
            'success': True, 'message': msg,
            'ticket': TicketSerializer(ticket).data
        })


class VisitorLogViewSet(viewsets.ModelViewSet):
    queryset = VisitorLog.objects.select_related(
        'ticket', 'showtime', 'showtime__movie',
        'showtime__room', 'logged_by'
    )
    serializer_class = VisitorLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsTicketManager]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'phone', 'email']
    ordering_fields = ['entered_at']
    filterset_fields = ['showtime', 'showtime__room__cinema']

    def perform_create(self, serializer):
        serializer.save(logged_by=self.request.user)

    @extend_schema(summary="List visitor logs by showtime", responses={200: VisitorLogSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def by_showtime(self, request):
        showtime_id = request.query_params.get('showtime_id')
        if not showtime_id:
            return Response({'error': 'showtime_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        visitors = self.get_queryset().filter(showtime_id=showtime_id)
        serializer = self.get_serializer(visitors, many=True)
        return Response(serializer.data)

    @extend_schema(summary="List today's visitor logs", responses={200: VisitorLogSerializer(many=True)})
    @action(detail=False, methods=['get'])
    def today(self, request):
        from django.utils import timezone
        visitors = self.get_queryset().filter(entered_at__date=timezone.now().date())
        serializer = self.get_serializer(visitors, many=True)
        return Response(serializer.data)


class VisitorRegistrationView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=VisitorRegistrationSerializer, responses={201: VisitorLogSerializer})
    def post(self, request):
        serializer = VisitorRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visitor = serializer.save()

        data = VisitorLogSerializer(visitor).data

        if visitor.ticket:
            data['reservation_found'] = True
            data['welcome_message'] = (
                f"Καλως ηρθατε {visitor.first_name}! "
                f"Η κρατηση σας για {visitor.showtime.movie.title} βρεθηκε. "
                f"Αιθουσα: {visitor.showtime.room.name}"
            )
        else:
            data['reservation_found'] = False
            data['message'] = 'Registration complete. No existing reservation found.'

        return Response(data, status=status.HTTP_201_CREATED)


class VisitorSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=VisitorSearchSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = VisitorSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data.get('phone')
        email = serializer.validated_data.get('email')
        showtime_id = serializer.validated_data.get('showtime_id')

        search_filter = models.Q()
        if phone:
            search_filter |= models.Q(user__phone=phone) | models.Q(guest_phone=phone)
        if email:
            search_filter |= models.Q(user__email=email) | models.Q(guest_email=email)

        reservations = Reservation.objects.filter(
            search_filter, status=Reservation.Status.CONFIRMED
        ).select_related('showtime', 'showtime__movie', 'showtime__room')

        if showtime_id:
            reservations = reservations.filter(showtime_id=showtime_id)

        if not reservations.exists():
            return Response({'found': False, 'message': 'No reservations found.'})

        reservation = reservations.first()
        name = reservation.user.first_name if reservation.user else "Visitor"

        tickets = Ticket.objects.filter(reservation__in=reservations)
        tickets_data = TicketSerializer(tickets, many=True).data

        return Response({
            'found': True,
            'welcome_message': f"Καλως ηρθατε, {name}!",
            'reservation_details': {
                'code': str(reservation.id),
                'cinema_name': reservation.showtime.room.cinema.name,
                'room_name': reservation.showtime.room.name,
                'room_description': reservation.showtime.room.description,
                'movie_title': reservation.showtime.movie.title,
                'seats': reservation.seat_numbers,
                'start_time': reservation.showtime.start_time,
            },
            'tickets': tickets_data,
        })

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
    # read-only, users see their own tickets, managers see all
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
    filterset_fields = ['status', 'checked_in']

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.can_manage_venues:
            qs = qs.filter(reservation__user=self.request.user)
        return qs

    @action(detail=False, methods=['get'])
    def my_tickets(self, request):
        tickets = self.get_queryset().filter(
            reservation__user=request.user,
            status=Ticket.Status.VALID
        )
        serializer = self.get_serializer(tickets, many=True)
        return Response(serializer.data)


class TicketValidationView(APIView):
    # validates a QR code without actually checking in
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
    # does the actual check-in and creates a visitor log entry
    permission_classes = [permissions.IsAuthenticated, IsTicketManager]

    @extend_schema(request=TicketCheckInSerializer,
                   responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT,
                              404: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = TicketCheckInSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # find ticket by QR or by ID
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

        # log the entry
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
    # managers only - visitor entry logs
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

    @action(detail=False, methods=['get'])
    def by_showtime(self, request):
        sid = request.query_params.get('showtime_id')
        if not sid:
            return Response({'error': 'showtime_id is required.'},
                            status=status.HTTP_400_BAD_REQUEST)
        visitors = self.get_queryset().filter(showtime_id=sid)
        serializer = self.get_serializer(visitors, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        from django.utils import timezone
        visitors = self.get_queryset().filter(entered_at__date=timezone.now().date())
        serializer = self.get_serializer(visitors, many=True)
        return Response(serializer.data)


class VisitorRegistrationView(APIView):
    # public endpoint - walk-in visitors register here
    # tries to match them with an existing reservation
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
    # public - search for reservation by phone or email
    permission_classes = [permissions.AllowAny]

    @extend_schema(request=VisitorSearchSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = VisitorSearchSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        phone = serializer.validated_data.get('phone')
        email = serializer.validated_data.get('email')
        showtime_id = serializer.validated_data.get('showtime_id')

        q = models.Q()
        if phone:
            q |= models.Q(user__phone=phone) | models.Q(guest_phone=phone)
        if email:
            q |= models.Q(user__email=email) | models.Q(guest_email=email)

        qs = Reservation.objects.filter(
            q, status=Reservation.Status.CONFIRMED
        ).select_related('showtime', 'showtime__movie', 'showtime__room')

        if showtime_id:
            qs = qs.filter(showtime_id=showtime_id)

        if not qs.exists():
            return Response({'found': False, 'message': 'No reservations found.'})

        res = qs.first()
        name = res.user.first_name if res.user else "Visitor"

        return Response({
            'found': True,
            'welcome_message': f"Καλως ηρθατε, {name}!",
            'reservation_details': {
                'code': str(res.id),
                'cinema_name': res.showtime.room.cinema.name,
                'room_name': res.showtime.room.name,
                'room_description': res.showtime.room.description,
                'movie_title': res.showtime.movie.title,
                'seats': res.seat_numbers,
                'start_time': res.showtime.start_time,
            },
        })

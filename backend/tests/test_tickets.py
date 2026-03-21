from django.urls import reverse
from rest_framework import status
from .base import BaseAPITestCase
from apps.venues.models import Cinema, Room, Movie, Showtime
from apps.reservations.models import Reservation
from apps.tickets.models import Ticket, VisitorLog
from django.utils import timezone
from datetime import timedelta

class TicketTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.cinema = Cinema.objects.create(name='Test Cinema', city='City')
        self.room = Room.objects.create(cinema=self.cinema, name='Room 1', capacity=10)
        self.movie = Movie.objects.create(title='Test Movie', duration_minutes=120)
        self.showtime = Showtime.objects.create(
            movie=self.movie,
            room=self.room,
            start_time=timezone.now() + timedelta(hours=1),
            price=10.00,
            is_active=True
        )
        self.reservation = Reservation.objects.create(
            user=self.regular_user,
            showtime=self.showtime,
            num_seats=1,
            seat_numbers=['A1'],
            total_price=10.00,
        )
        self.reservation.confirm(changed_by=self.manager_user, notes='Test setup')
        self.ticket = self.reservation.tickets.first()

    def test_my_tickets(self):
        url = reverse('ticket-my-tickets')
        self.authenticate(self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_ticket_validation_as_manager(self):
        url = reverse('ticket-validate')
        self.authenticate(self.manager_user)
        data = {'qr_data': self.ticket.qr_data}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['valid'])

    def test_ticket_checkin_as_manager(self):
        url = reverse('ticket-checkin')
        self.authenticate(self.manager_user)
        data = {'qr_data': self.ticket.qr_data}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        
        self.ticket.refresh_from_db()
        self.assertTrue(self.ticket.checked_in)
        self.assertEqual(self.ticket.status, Ticket.Status.USED)
        self.assertTrue(VisitorLog.objects.filter(ticket=self.ticket).exists())

    def test_ticket_checkin_unauthorized(self):
        url = reverse('ticket-checkin')
        self.authenticate(self.regular_user)
        data = {'qr_data': self.ticket.qr_data}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

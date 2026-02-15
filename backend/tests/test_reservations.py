from django.urls import reverse
from rest_framework import status
from .base import BaseAPITestCase
from apps.venues.models import Cinema, Room, Movie, Showtime
from apps.reservations.models import Reservation
from django.utils import timezone
from datetime import timedelta

class ReservationTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.cinema = Cinema.objects.create(name='Test Cinema', city='City')
        self.room = Room.objects.create(cinema=self.cinema, name='Room 1', capacity=10)
        self.movie = Movie.objects.create(title='Test Movie', duration_minutes=120)
        self.showtime = Showtime.objects.create(
            movie=self.movie,
            room=self.room,
            start_time=timezone.now() + timedelta(days=1),
            price=10.00,
            is_active=True
        )

    def test_create_reservation(self):
        url = reverse('reservation-list')
        self.authenticate(self.regular_user)
        data = {
            'showtime': str(self.showtime.id),
            'num_seats': 2,
            'seat_numbers': ['A1', 'A2']
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(Reservation.objects.count(), 1)
        self.assertEqual(Reservation.objects.first().total_price, 20.00)

    def test_my_reservations(self):
        Reservation.objects.create(
            user=self.regular_user,
            showtime=self.showtime,
            num_seats=1,
            total_price=10.00
        )
        url = reverse('reservation-my-reservations')
        self.authenticate(self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_cancel_own_reservation(self):
        res = Reservation.objects.create(
            user=self.regular_user,
            showtime=self.showtime,
            num_seats=1,
            total_price=10.00,
            status=Reservation.Status.CONFIRMED
        )
        url = reverse('reservation-cancel', args=[res.id])
        self.authenticate(self.regular_user)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        res.refresh_from_db()
        self.assertEqual(res.status, Reservation.Status.CANCELLED)

    def test_cancel_others_reservation(self):
        other_user = self.create_user(email='other@test.com', password='Password123!')
        res = Reservation.objects.create(
            user=other_user,
            showtime=self.showtime,
            num_seats=1,
            total_price=10.00
        )
        url = reverse('reservation-cancel', args=[res.id])
        self.authenticate(self.regular_user)
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

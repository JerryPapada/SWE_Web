from django.urls import reverse
from rest_framework import status
from .base import BaseAPITestCase
from apps.venues.models import Cinema, Room, Movie, Showtime
from django.utils import timezone
from datetime import timedelta

class VenueTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.cinema = Cinema.objects.create(
            name='Test Cinema',
            city='Test City',
            is_active=True
        )
        self.room = Room.objects.create(
            cinema=self.cinema,
            name='Room 1',
            capacity=100,
            rows=10,
            seats_per_row=10,
            is_active=True
        )
        self.movie = Movie.objects.create(
            title='Test Movie',
            duration_minutes=120,
            is_active=True
        )
        self.showtime = Showtime.objects.create(
            movie=self.movie,
            room=self.room,
            start_time=timezone.now() + timedelta(days=1),
            price=10.00,
            is_active=True
        )

    def test_list_cinemas(self):
        url = reverse('cinema-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_movies(self):
        url = reverse('movie-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_cinema_as_manager(self):
        url = reverse('cinema-list')
        self.authenticate(self.manager_user)
        data = {
            'name': 'New Cinema',
            'city': 'New City',
            'address': 'New Address',
            'is_active': True
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Cinema.objects.count(), 2)

    def test_create_cinema_as_regular_user(self):
        url = reverse('cinema-list')
        self.authenticate(self.regular_user)
        data = {'name': 'Denied Cinema'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

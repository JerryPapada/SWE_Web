from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.venues.models import Cinema, Movie, Room, Showtime


class Command(BaseCommand):
    help = 'Seed initial cinemas, rooms, movies and showtimes.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--if-empty',
            action='store_true',
            help='Insert seed data only when core venue/movie tables are empty.',
        )

    def handle(self, *args, **options):
        if options['if_empty'] and not self._is_empty_database():
            self.stdout.write(self.style.WARNING('Seed skipped: data already exists.'))
            return

        cinemas = self._seed_cinemas()
        rooms = self._seed_rooms(cinemas)
        movies = self._seed_movies()
        showtimes_created = self._seed_showtimes(rooms, movies)

        self.stdout.write(
            self.style.SUCCESS(
                f'Seed completed: {len(cinemas)} cinemas, {len(rooms)} rooms, '
                f'{len(movies)} movies, {showtimes_created} showtimes.'
            )
        )

    def _is_empty_database(self):
        return not (
            Cinema.objects.exists()
            or Room.objects.exists()
            or Movie.objects.exists()
            or Showtime.objects.exists()
        )

    def _seed_cinemas(self):
        definitions = [
            {
                'name': 'Athens City Cinema',
                'defaults': {
                    'description': 'Modern city cinema in central Athens.',
                    'address': '28 Stadiou Avenue',
                    'city': 'Athens',
                    'phone': '+30 210 111 2222',
                    'email': 'athens@cinema.local',
                    'is_active': True,
                },
            },
            {
                'name': 'Piraeus Harbor Screens',
                'defaults': {
                    'description': 'Seaside multiplex near the port.',
                    'address': '12 Akti Miaouli',
                    'city': 'Piraeus',
                    'phone': '+30 210 333 4444',
                    'email': 'piraeus@cinema.local',
                    'is_active': True,
                },
            },
        ]

        cinemas = []
        for item in definitions:
            cinema, _ = Cinema.objects.get_or_create(name=item['name'], defaults=item['defaults'])
            cinemas.append(cinema)
        return cinemas

    def _seed_rooms(self, cinemas):
        if len(cinemas) < 2:
            return []

        definitions = [
            {
                'cinema': cinemas[0],
                'name': 'Hall A',
                'capacity': 120,
                'rows': 10,
                'seats_per_row': 12,
                'room_type': Room.RoomType.SIMPLE,
                'description': 'Classic projection hall.',
            },
            {
                'cinema': cinemas[0],
                'name': 'Hall B',
                'capacity': 96,
                'rows': 8,
                'seats_per_row': 12,
                'room_type': Room.RoomType.THREE_D,
                'description': '3D-ready hall with upgraded sound.',
            },
            {
                'cinema': cinemas[1],
                'name': 'IMAX 1',
                'capacity': 150,
                'rows': 10,
                'seats_per_row': 15,
                'room_type': Room.RoomType.IMAX,
                'description': 'Large format IMAX screen.',
            },
        ]

        rooms = []
        for item in definitions:
            room, _ = Room.objects.get_or_create(
                cinema=item['cinema'],
                name=item['name'],
                defaults={
                    'description': item['description'],
                    'capacity': item['capacity'],
                    'rows': item['rows'],
                    'seats_per_row': item['seats_per_row'],
                    'room_type': item['room_type'],
                    'is_active': True,
                },
            )
            rooms.append(room)
        return rooms

    def _seed_movies(self):
        definitions = [
            {
                'title': 'The Last Signal',
                'original_title': 'The Last Signal',
                'description': 'A rescue crew races to decode an interstellar distress call.',
                'duration_minutes': 124,
                'genre': Movie.Genre.SCI_FI,
                'director': 'Nikos Arvanitis',
                'cast': 'Eleni Markou, Petros Vassilis',
                'rating': Movie.Rating.PG13,
                'trailer_url': 'https://example.com/trailers/the-last-signal',
                'is_active': True,
            },
            {
                'title': 'Marble Streets',
                'original_title': 'Marble Streets',
                'description': 'A detective drama set in the old neighborhoods of Athens.',
                'duration_minutes': 110,
                'genre': Movie.Genre.DRAMA,
                'director': 'Iris Papadaki',
                'cast': 'Giorgos Leon, Anna Kosta',
                'rating': Movie.Rating.PG13,
                'trailer_url': 'https://example.com/trailers/marble-streets',
                'is_active': True,
            },
            {
                'title': 'Laughing Tide',
                'original_title': 'Laughing Tide',
                'description': 'A feel-good comedy about a family-run island ferry.',
                'duration_minutes': 98,
                'genre': Movie.Genre.COMEDY,
                'director': 'Maria Theodorou',
                'cast': 'Sofia Nika, Andreas Rouvas',
                'rating': Movie.Rating.PG,
                'trailer_url': 'https://example.com/trailers/laughing-tide',
                'is_active': True,
            },
        ]

        movies = []
        for item in definitions:
            movie, _ = Movie.objects.get_or_create(
                title=item['title'],
                defaults={
                    'original_title': item['original_title'],
                    'description': item['description'],
                    'duration_minutes': item['duration_minutes'],
                    'genre': item['genre'],
                    'director': item['director'],
                    'cast': item['cast'],
                    'rating': item['rating'],
                    'trailer_url': item['trailer_url'],
                    'is_active': item['is_active'],
                },
            )
            movies.append(movie)
        return movies

    def _seed_showtimes(self, rooms, movies):
        if not rooms or not movies:
            return 0

        combinations = [
            (rooms[0], movies[0], 1, 18, Decimal('8.50')),
            (rooms[1], movies[1], 1, 20, Decimal('9.00')),
            (rooms[2], movies[2], 2, 19, Decimal('10.50')),
            (rooms[0], movies[2], 2, 21, Decimal('8.00')),
        ]

        created_count = 0
        for room, movie, day_offset, hour, price in combinations:
            start_time = self._build_start_time(day_offset, hour)
            end_time = start_time + timedelta(minutes=movie.duration_minutes + 15)

            _, created = Showtime.objects.get_or_create(
                movie=movie,
                room=room,
                start_time=start_time,
                defaults={
                    'end_time': end_time,
                    'price': price,
                    'is_active': True,
                    'available_seats': room.capacity,
                },
            )
            if created:
                created_count += 1

        return created_count

    def _build_start_time(self, day_offset, hour):
        now = timezone.now()
        start = now.replace(hour=hour, minute=0, second=0, microsecond=0) + timedelta(days=day_offset)
        if start <= now:
            start += timedelta(days=1)
        return start

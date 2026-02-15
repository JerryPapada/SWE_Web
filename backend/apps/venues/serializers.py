from rest_framework import serializers
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes
from .models import Cinema, Room, Movie, Showtime


class CinemaSerializer(serializers.ModelSerializer):
    rooms_count = serializers.SerializerMethodField()

    class Meta:
        model = Cinema
        fields = [
            'id', 'name', 'description', 'address', 'city',
            'phone', 'email', 'photo', 'is_active',
            'rooms_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    @extend_schema_field(OpenApiTypes.INT)
    def get_rooms_count(self, obj):
        return obj.rooms.count()


class RoomSerializer(serializers.ModelSerializer):
    cinema_name = serializers.CharField(source='cinema.name', read_only=True)

    class Meta:
        model = Room
        fields = [
            'id', 'cinema', 'cinema_name', 'name', 'description',
            'capacity', 'rows', 'seats_per_row', 'photo', 'is_active',
            'has_3d', 'has_imax', 'has_dolby_atmos',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class RoomDetailSerializer(RoomSerializer):
    # includes full cinema object instead of just the id
    cinema = CinemaSerializer(read_only=True)
    cinema_id = serializers.UUIDField(write_only=True)

    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ['cinema_id']


class MovieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'original_title', 'description',
            'duration_minutes', 'genre', 'director', 'cast',
            'rating', 'poster', 'trailer_url', 'release_date',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class MovieListSerializer(serializers.ModelSerializer):
    # lighter version for list views
    class Meta:
        model = Movie
        fields = [
            'id', 'title', 'duration_minutes', 'genre',
            'rating', 'poster', 'is_active'
        ]


class ShowtimeSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    cinema_name = serializers.CharField(source='room.cinema.name', read_only=True)
    is_sold_out = serializers.BooleanField(read_only=True)
    occupancy_percentage = serializers.FloatField(read_only=True)

    class Meta:
        model = Showtime
        fields = [
            'id', 'movie', 'movie_title', 'room', 'room_name',
            'cinema_name', 'start_time', 'end_time', 'price',
            'is_active', 'available_seats', 'is_3d', 'is_imax',
            'is_sold_out', 'occupancy_percentage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'end_time', 'created_at', 'updated_at']


class ShowtimeDetailSerializer(ShowtimeSerializer):
    # nested objects for detail/create/update
    movie = MovieListSerializer(read_only=True)
    room = RoomSerializer(read_only=True)
    movie_id = serializers.UUIDField(write_only=True)
    room_id = serializers.UUIDField(write_only=True)

    class Meta(ShowtimeSerializer.Meta):
        fields = ShowtimeSerializer.Meta.fields + ['movie_id', 'room_id']


class ShowtimeCalendarSerializer(serializers.ModelSerializer):
    # minimal fields for the calendar widget
    movie_title = serializers.CharField(source='movie.title', read_only=True)
    movie_poster = serializers.ImageField(source='movie.poster', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    cinema_name = serializers.CharField(source='room.cinema.name', read_only=True)

    class Meta:
        model = Showtime
        fields = [
            'id', 'movie_title', 'movie_poster', 'room_name',
            'cinema_name', 'start_time', 'end_time', 'price',
            'available_seats', 'is_3d', 'is_imax'
        ]

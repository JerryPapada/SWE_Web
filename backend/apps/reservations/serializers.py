from rest_framework import serializers
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from apps.venues.serializers import ShowtimeCalendarSerializer
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    # basic reservation info with some denormalized fields for convenience
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    movie_title = serializers.CharField(source='showtime.movie.title', read_only=True)
    cinema_name = serializers.CharField(source='showtime.room.cinema.name', read_only=True)
    room_name = serializers.CharField(source='showtime.room.name', read_only=True)
    showtime_datetime = serializers.DateTimeField(source='showtime.start_time', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id', 'user', 'user_email', 'user_name',
            'showtime', 'movie_title', 'cinema_name', 'room_name', 'showtime_datetime',
            'num_seats', 'seat_numbers', 'total_price',
            'status', 'guest_email', 'guest_phone', 'notes',
            'created_at', 'updated_at', 'confirmed_at', 'cancelled_at'
        ]
        read_only_fields = [
            'id', 'user', 'total_price', 'status',
            'created_at', 'updated_at', 'confirmed_at', 'cancelled_at'
        ]


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'showtime', 'num_seats', 'seat_numbers',
            'guest_email', 'guest_phone', 'notes'
        ]

    def validate_showtime(self, value):
        if not value.is_active:
            raise serializers.ValidationError('This showtime is not available.')
        if value.start_time <= timezone.now():
            raise serializers.ValidationError('Cannot book past showtimes.')
        return value

    def validate_num_seats(self, value):
        if value < 1:
            raise serializers.ValidationError('Must reserve at least 1 seat.')
        if value > 10:
            raise serializers.ValidationError('Maximum 10 seats per reservation.')
        return value

    def validate(self, data):
        showtime = data.get('showtime')
        seats = data.get('num_seats', 1)

        if showtime.available_seats < seats:
            raise serializers.ValidationError({
                'num_seats': f'Only {showtime.available_seats} seats available.'
            })
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        validated_data['total_price'] = (
            validated_data['showtime'].price * validated_data.get('num_seats', 1)
        )
        reservation = Reservation.objects.create(**validated_data)
        reservation.confirm()
        return reservation


class ReservationDetailSerializer(ReservationSerializer):
    showtime = ShowtimeCalendarSerializer(read_only=True)


class MyReservationsSerializer(serializers.ModelSerializer):
    # lighter serializer for the "my reservations" endpoint
    movie_title = serializers.CharField(source='showtime.movie.title', read_only=True)
    movie_poster = serializers.ImageField(source='showtime.movie.poster', read_only=True)
    cinema_name = serializers.CharField(source='showtime.room.cinema.name', read_only=True)
    showtime_datetime = serializers.DateTimeField(source='showtime.start_time', read_only=True)
    has_ticket = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            'id', 'movie_title', 'movie_poster', 'cinema_name',
            'showtime_datetime', 'num_seats', 'total_price',
            'status', 'has_ticket', 'created_at'
        ]

    @extend_schema_field(OpenApiTypes.BOOL)
    def get_has_ticket(self, obj):
        return hasattr(obj, 'ticket')

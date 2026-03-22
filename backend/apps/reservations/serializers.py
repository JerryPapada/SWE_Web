from rest_framework import serializers
from django.db import transaction
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

from apps.venues.models import Showtime, ShowtimeSeat
from apps.venues.serializers import ShowtimeCalendarSerializer
from .models import Reservation, ReservationHistory

class ReservationSerializer(serializers.ModelSerializer):
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
    send_email = serializers.BooleanField(write_only=True, required=False, default=True)

    class Meta:
        model = Reservation
        fields = [
            'showtime', 'num_seats', 'seat_numbers',
            'guest_email', 'guest_phone', 'notes', 'send_email'
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
        seat_numbers = list(data.get('seat_numbers') or [])

        if showtime.available_seats < seats:
            raise serializers.ValidationError({
                'num_seats': f'Only {showtime.available_seats} seats available.'
            })
        if seat_numbers:
            if len(seat_numbers) != seats:
                raise serializers.ValidationError({
                    'seat_numbers': 'Seat count must match number of seats.'
                })
            if len(set(seat_numbers)) != len(seat_numbers):
                raise serializers.ValidationError({
                    'seat_numbers': 'Duplicate seat numbers are not allowed.'
                })
            
            ShowtimeSeat.generate_for_showtime(showtime)
            seats_qs = ShowtimeSeat.objects.filter(
                showtime=showtime,
                seat_number__in=seat_numbers
            )
            if seats_qs.count() != len(seat_numbers):
                raise serializers.ValidationError({
                    'seat_numbers': 'One or more selected seats are invalid.'
                })
            if seats_qs.filter(is_reserved=True).exists():
                raise serializers.ValidationError({
                    'seat_numbers': 'One or more selected seats are already taken.'
                })
        return data

    def create(self, validated_data):
        request = self.context['request']
        send_email = validated_data.pop('send_email', True)
        num_seats = validated_data.get('num_seats', 1)
        showtime_id = validated_data['showtime'].id

        with transaction.atomic():
            locked_showtime = Showtime.objects.select_for_update().get(pk=showtime_id)
            if not locked_showtime.is_active:
                raise serializers.ValidationError({'showtime': 'This showtime is not available.'})
            if locked_showtime.start_time <= timezone.now():
                raise serializers.ValidationError({'showtime': 'Cannot book past showtimes.'})
            if locked_showtime.available_seats < num_seats:
                raise serializers.ValidationError({
                    'num_seats': f'Only {locked_showtime.available_seats} seats available.'
                })

            validated_data['user'] = request.user
            validated_data['showtime'] = locked_showtime
            validated_data['total_price'] = locked_showtime.price * num_seats
            reservation = Reservation.objects.create(**validated_data)

            try:
                reservation.confirm(
                    changed_by=request.user,
                    notes='Created via booking form',
                    send_email=send_email
                )
            except ValueError as exc:
                raise serializers.ValidationError({'detail': str(exc)}) from exc
        return reservation


class ReservationDetailSerializer(ReservationSerializer):
    showtime = ShowtimeCalendarSerializer(read_only=True)


class MyReservationsSerializer(serializers.ModelSerializer):
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
        return obj.tickets.exists()


class ReservationHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(source='changed_by.email', read_only=True)

    class Meta:
        model = ReservationHistory
        fields = [
            'id', 'reservation', 'old_status', 'new_status',
            'changed_by', 'changed_by_email', 'notes', 'created_at'
        ]
        read_only_fields = fields

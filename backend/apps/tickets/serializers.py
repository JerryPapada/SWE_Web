from rest_framework import serializers
from django.db import models
from .models import Ticket, VisitorLog


class TicketSerializer(serializers.ModelSerializer):
    reservation_id = serializers.UUIDField(source='reservation.id', read_only=True)
    user_email = serializers.EmailField(source='reservation.user.email', read_only=True)
    movie_title = serializers.CharField(source='reservation.showtime.movie.title', read_only=True)
    cinema_name = serializers.CharField(source='reservation.showtime.room.cinema.name', read_only=True)
    room_name = serializers.CharField(source='reservation.showtime.room.name', read_only=True)
    showtime = serializers.DateTimeField(source='reservation.showtime.start_time', read_only=True)
    seat_numbers = serializers.JSONField(source='reservation.seat_numbers', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'reservation_id', 'user_email',
            'movie_title', 'cinema_name', 'room_name',
            'showtime', 'seat_numbers',
            'qr_code', 'qr_data', 'status',
            'checked_in', 'checked_in_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'qr_code', 'qr_data', 'status',
            'checked_in', 'checked_in_at',
            'created_at', 'updated_at'
        ]


class TicketValidationSerializer(serializers.Serializer):
    qr_data = serializers.CharField(required=True)


class TicketCheckInSerializer(serializers.Serializer):
    qr_data = serializers.CharField(required=False)
    ticket_id = serializers.UUIDField(required=False)

    def validate(self, data):
        if not data.get('qr_data') and not data.get('ticket_id'):
            raise serializers.ValidationError('Either qr_data or ticket_id is required.')
        return data


class VisitorLogSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='showtime.movie.title', read_only=True)
    room_name = serializers.CharField(source='showtime.room.name', read_only=True)
    ticket_id = serializers.UUIDField(source='ticket.id', read_only=True)

    class Meta:
        model = VisitorLog
        fields = [
            'id', 'ticket', 'ticket_id',
            'first_name', 'last_name', 'phone', 'email', 'photo',
            'showtime', 'movie_title', 'room_name',
            'entered_at', 'logged_by', 'notes'
        ]
        read_only_fields = ['id', 'entered_at', 'logged_by']


class VisitorRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitorLog
        fields = ['first_name', 'last_name', 'phone', 'email', 'photo', 'showtime']

    def create(self, validated_data):
        from apps.reservations.models import Reservation

        phone = validated_data.get('phone')
        email = validated_data.get('email')
        showtime = validated_data.get('showtime')

        reservation = Reservation.objects.filter(
            showtime=showtime, status='CONFIRMED'
        ).filter(
            models.Q(user__phone=phone) | models.Q(user__email=email) |
            models.Q(guest_phone=phone) | models.Q(guest_email=email)
        ).first()

        if reservation and hasattr(reservation, 'ticket'):
            validated_data['ticket'] = reservation.ticket

        return super().create(validated_data)


class VisitorSearchSerializer(serializers.Serializer):
    phone = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)
    showtime_id = serializers.UUIDField(required=False)

    def validate(self, data):
        if not data.get('phone') and not data.get('email'):
            raise serializers.ValidationError('Either phone or email is required.')
        return data

from django.contrib import admin
from .models import Cinema, Room, Movie, Showtime


@admin.register(Cinema)
class CinemaAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'phone', 'is_active', 'created_at']
    list_filter = ['city', 'is_active', 'created_at']
    search_fields = ['name', 'city', 'address']
    ordering = ['name']


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['name', 'cinema', 'capacity', 'room_type', 'is_active']
    list_filter = ['cinema', 'room_type', 'is_active']
    search_fields = ['name', 'cinema__name']
    ordering = ['cinema', 'name']


@admin.register(Movie)
class MovieAdmin(admin.ModelAdmin):
    list_display = ['title', 'genre', 'duration_minutes', 'rating', 'release_date', 'is_active']
    list_filter = ['genre', 'rating', 'is_active', 'release_date']
    search_fields = ['title', 'original_title', 'director']
    ordering = ['-release_date', 'title']


@admin.register(Showtime)
class ShowtimeAdmin(admin.ModelAdmin):
    list_display = ['movie', 'room', 'start_time', 'price', 'available_seats', 'is_active']
    list_filter = ['room__cinema', 'movie', 'is_3d', 'is_imax', 'is_active', 'start_time']
    search_fields = ['movie__title', 'room__name', 'room__cinema__name']
    ordering = ['start_time']
    date_hierarchy = 'start_time'

from django.contrib import admin
from .models import Reservation, ReservationHistory


@admin.register(Reservation)
class ReservationAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'get_movie', 'get_showtime',
        'num_seats', 'total_price', 'status', 'created_at'
    ]
    list_filter = ['status', 'showtime__room__cinema', 'created_at']
    search_fields = ['user__email', 'showtime__movie__title', 'id']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'confirmed_at', 'cancelled_at']

    def get_movie(self, obj):
        return obj.showtime.movie.title
    get_movie.short_description = 'Movie'

    def get_showtime(self, obj):
        return obj.showtime.start_time
    get_showtime.short_description = 'Showtime'


@admin.register(ReservationHistory)
class ReservationHistoryAdmin(admin.ModelAdmin):
    list_display = ['reservation', 'old_status', 'new_status', 'changed_by', 'created_at']
    list_filter = ['new_status', 'created_at']
    search_fields = ['reservation__id', 'changed_by__email']
    ordering = ['-created_at']

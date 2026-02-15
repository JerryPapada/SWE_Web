from django.contrib import admin
from .models import Ticket, VisitorLog


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'get_user', 'get_movie', 'status',
        'checked_in', 'checked_in_at', 'created_at'
    ]
    list_filter = ['status', 'checked_in', 'created_at']
    search_fields = [
        'id', 'qr_data',
        'reservation__user__email',
        'reservation__showtime__movie__title'
    ]
    readonly_fields = ['qr_code', 'qr_data', 'created_at', 'updated_at']
    
    def get_user(self, obj):
        return obj.reservation.user.email
    get_user.short_description = 'User'
    
    def get_movie(self, obj):
        return obj.reservation.showtime.movie.title
    get_movie.short_description = 'Movie'


@admin.register(VisitorLog)
class VisitorLogAdmin(admin.ModelAdmin):
    list_display = [
        'first_name', 'last_name', 'email', 'phone',
        'get_movie', 'entered_at', 'logged_by'
    ]
    list_filter = ['showtime__room__cinema', 'entered_at']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    readonly_fields = ['entered_at']
    
    def get_movie(self, obj):
        return obj.showtime.movie.title
    get_movie.short_description = 'Movie'

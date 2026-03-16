from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CinemaViewSet, RoomViewSet, MovieViewSet, ShowtimeViewSet

router = DefaultRouter()
router.register('cinemas', CinemaViewSet, basename='cinema')
router.register('rooms', RoomViewSet, basename='room')
router.register('movies', MovieViewSet, basename='movie')
router.register('showtimes', ShowtimeViewSet, basename='showtime')

urlpatterns = [
    path('', include(router.urls)),
]

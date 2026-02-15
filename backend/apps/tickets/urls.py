from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    TicketViewSet,
    TicketValidationView,
    TicketCheckInView,
    VisitorLogViewSet,
    VisitorRegistrationView,
    VisitorSearchView,
)

router = DefaultRouter()
router.register('', TicketViewSet, basename='ticket')
router.register('visitors', VisitorLogViewSet, basename='visitor-log')

urlpatterns = [
    path('validate/', TicketValidationView.as_view(), name='ticket-validate'),
    path('checkin/', TicketCheckInView.as_view(), name='ticket-checkin'),
    path('register/', VisitorRegistrationView.as_view(), name='visitor-register'),
    path('search/', VisitorSearchView.as_view(), name='visitor-search'),
    path('', include(router.urls)),
]

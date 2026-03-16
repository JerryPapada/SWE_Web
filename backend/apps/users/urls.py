from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    RegisterView,
    ProfileView,
    ChangePasswordView,
    GoogleLogin,
    AdminUserManagementViewSet,
)

router = DefaultRouter()
router.register('manage', AdminUserManagementViewSet, basename='user-manage')

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('change-password/', ChangePasswordView.as_view(), name='user-change-password'),
    path('google/', GoogleLogin.as_view(), name='google_login'),
    path('', include(router.urls)),
]

import os

from rest_framework import generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from drf_spectacular.utils import extend_schema
from drf_spectacular.types import OpenApiTypes
from django.contrib.auth import get_user_model

from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client
from dj_rest_auth.registration.views import SocialLoginView

from .serializers import (
    UserSerializer, UserRegistrationSerializer,
    UserProfileUpdateSerializer, ChangePasswordSerializer,
    AdminUserSerializer,
)
from .permissions import IsAdmin

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer


class ProfileView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(request=ChangePasswordSerializer, responses={200: OpenApiTypes.OBJECT})
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)


class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client

    @property
    def callback_url(self):
        from django.conf import settings
        return os.environ.get(
            'GOOGLE_CALLBACK_URL',
            getattr(settings, 'FRONTEND_URL', 'http://localhost:4200') + '/auth/google/callback'
        )


class AdminUserManagementViewSet(ModelViewSet):
    queryset = User.objects.all()
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filterset_fields = ['role', 'is_active']
    search_fields = ['email', 'first_name', 'last_name', 'phone']
    ordering_fields = ['created_at', 'email', 'last_name']

    @action(detail=True, methods=['post'])
    def assign_role(self, request, pk=None):
        user = self.get_object()
        role = request.data.get('role')
        roles = request.data.get('roles')

        valid_roles = dict(User.Role.choices)
        if roles is not None:
            if not isinstance(roles, (list, tuple)):
                return Response({'error': 'Roles must be a list.'}, status=status.HTTP_400_BAD_REQUEST)
            invalid = [r for r in roles if r not in valid_roles]
            if invalid:
                return Response(
                    {'error': f'Invalid roles. Choose from: {list(valid_roles)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user.roles = list(dict.fromkeys(roles))
            if user.role not in user.roles and user.roles:
                user.role = user.roles[0]
            user.save()
            return Response({'message': f'Roles updated for {user.email}.', 'roles': user.roles},
                            status=status.HTTP_200_OK)

        if role not in valid_roles:
            return Response(
                {'error': f'Invalid role. Choose from: {list(valid_roles)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        roles_set = set(user.roles or [])
        roles_set.add(role)
        user.roles = list(roles_set)
        user.role = role if user.role != role else user.role
        user.save()
        return Response({'message': f'Role {role} assigned to {user.email}', 'roles': user.roles},
                        status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'message': f'User {user.email} deactivated.'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'message': f'User {user.email} activated.'}, status=status.HTTP_200_OK)

class UserRolesView(APIView):
    permission_classes = [permissions.AllowAny] 
    def get(self, request):
        roles = [{'value': key, 'label': label} for key, label in User.Role.choices]
        return Response(roles)  

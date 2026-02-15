from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class BaseAPITestCase(APITestCase):
    def setUp(self):
        self.admin_user = self.create_user(
            email='admin@test.com',
            password='Password123!',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True
        )
        self.manager_user = self.create_user(
            email='manager@test.com',
            password='Password123!',
            role=User.Role.TICKET_MANAGER,
            is_staff=True
        )
        self.regular_user = self.create_user(
            email='user@test.com',
            password='Password123!',
            role=User.Role.USER
        )

    def create_user(self, email, password, **extra_fields):
        return User.objects.create_user(
            email=email,
            password=password,
            first_name='Test',
            last_name='User',
            **extra_fields
        )

    def authenticate(self, user):
        refresh = RefreshToken.for_user(user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def logout(self):
        self.client.credentials()

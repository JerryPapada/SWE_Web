from django.urls import reverse
from rest_framework import status
from .base import BaseAPITestCase, User

class UserTests(BaseAPITestCase):
    def test_user_registration(self):
        url = reverse('user-register')
        data = {
            'email': 'newuser@test.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@test.com').exists())

    def test_user_profile_access(self):
        url = reverse('user-profile')
        
        # Unauthorized
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Authorized
        self.authenticate(self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], self.regular_user.email)

    def test_admin_user_management(self):
        url = reverse('user-manage-list')
        
        # Regular user cannot access
        self.authenticate(self.regular_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        # Admin can access
        self.authenticate(self.admin_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 3)

    def test_change_password(self):
        url = reverse('user-change-password')
        self.authenticate(self.regular_user)
        data = {
            'old_password': 'Password123!',
            'new_password': 'NewPassword123!',
            'new_password_confirm': 'NewPassword123!'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify can login with new password
        login_url = reverse('rest_login')
        login_data = {'email': self.regular_user.email, 'password': 'NewPassword123!'}
        response = self.client.post(login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

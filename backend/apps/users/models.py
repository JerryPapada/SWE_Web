import uuid
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Email-based auth instead of username."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', User.Role.ADMIN)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model with role-based permissions.
    
    Roles:
    - ADMIN: Full system access
    - TICKET_MANAGER: Can manage venues, movies, and tickets
    - USER: Can make reservations
    """
    
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Administrator')
        TICKET_MANAGER = 'TICKET_MANAGER', _('Ticket Manager')
        USER = 'USER', _('Regular User')
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    photo = models.ImageField(
        _('profile photo'),
        upload_to='users/photos/',
        blank=True,
        null=True
    )
    role = models.CharField(
        _('role'),
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )
    
    is_active = models.BooleanField(_('active'), default=True)
    is_staff = models.BooleanField(_('staff status'), default=False)
    
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']
    
    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email
    
    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()

    def get_short_name(self):
        return self.first_name

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_ticket_manager(self):
        return self.role == self.Role.TICKET_MANAGER

    @property
    def can_manage_venues(self):
        # both admins and ticket managers can handle venue/movie data
        return self.role in [self.Role.ADMIN, self.Role.TICKET_MANAGER]

    @property
    def can_make_reservations(self):
        return self.is_active  # inactive users blocked

import uuid
import qrcode
from io import BytesIO
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.files.base import ContentFile


class Ticket(models.Model):
    class Status(models.TextChoices):
        VALID = 'VALID', _('Valid')
        USED = 'USED', _('Used')
        EXPIRED = 'EXPIRED', _('Expired')
        CANCELLED = 'CANCELLED', _('Cancelled')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='ticket'
    )

    qr_code = models.ImageField(_('QR code'), upload_to='tickets/qr/', blank=True, null=True)
    qr_data = models.CharField(_('QR data'), max_length=500, unique=True, editable=False)

    status = models.CharField(_('status'), max_length=20,
                              choices=Status.choices, default=Status.VALID)

    checked_in = models.BooleanField(_('checked in'), default=False)
    checked_in_at = models.DateTimeField(_('checked in at'), null=True, blank=True)
    checked_in_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='checked_tickets'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _('ticket')
        verbose_name_plural = _('tickets')
        ordering = ['-created_at']

    def __str__(self):
        return f'Ticket {self.id} - {self.reservation}'

    def save(self, *args, **kwargs):
        if not self.qr_data:
            self.qr_data = self._make_qr_data()
        super().save(*args, **kwargs)
        if not self.qr_code:
            self._make_qr_image()

    def _make_qr_data(self):
        return f'CINEMA-TICKET-{self.id or uuid.uuid4()}'

    def _make_qr_image(self):
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L,
                           box_size=10, border=4)
        qr.add_data(self.qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color='black', back_color='white')
        buf = BytesIO()
        img.save(buf, format='PNG')
        buf.seek(0)

        self.qr_code.save(f'ticket_{self.id}.png', ContentFile(buf.read()), save=True)

    def check_in(self, staff_user=None):
        from django.utils import timezone

        if self.checked_in:
            return False, 'Ticket already used.'

        if self.status != self.Status.VALID:
            return False, f'Ticket is {self.status}.'

        if self.reservation.showtime.start_time < timezone.now():
            from datetime import timedelta
            cutoff = self.reservation.showtime.start_time + timedelta(minutes=30)
            if timezone.now() > cutoff:
                self.status = self.Status.EXPIRED
                self.save()
                return False, 'Ticket has expired.'

        self.checked_in = True
        self.checked_in_at = timezone.now()
        self.checked_in_by = staff_user
        self.status = self.Status.USED
        self.save()
        return True, 'Check-in successful!'

    @classmethod
    def validate_qr(cls, qr_data):
        try:
            return cls.objects.get(qr_data=qr_data)
        except cls.DoesNotExist:
            return None


class VisitorLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(Ticket, on_delete=models.SET_NULL,
                               null=True, blank=True, related_name='visitor_logs')

    first_name = models.CharField(_('first name'), max_length=150)
    last_name = models.CharField(_('last name'), max_length=150)
    phone = models.CharField(_('phone'), max_length=20)
    email = models.EmailField(_('email'))
    photo = models.ImageField(_('photo'), upload_to='visitors/', blank=True, null=True)

    showtime = models.ForeignKey('venues.Showtime', on_delete=models.CASCADE,
                                 related_name='visitor_logs')
    entered_at = models.DateTimeField(auto_now_add=True)
    logged_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                  null=True, related_name='logged_visitors')

    notes = models.TextField(_('notes'), blank=True)

    class Meta:
        verbose_name = _('visitor log')
        verbose_name_plural = _('visitor logs')
        ordering = ['-entered_at']

    def __str__(self):
        return f'{self.first_name} {self.last_name} - {self.showtime}'

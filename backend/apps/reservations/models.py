import uuid
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from django.core.mail import send_mail


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending')
        CONFIRMED = 'CONFIRMED', _('Confirmed')
        CANCELLED = 'CANCELLED', _('Cancelled')
        COMPLETED = 'COMPLETED', _('Completed')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reservations'
    )
    showtime = models.ForeignKey(
        'venues.Showtime',
        on_delete=models.CASCADE,
        related_name='reservations'
    )

    num_seats = models.PositiveIntegerField(_('number of seats'), default=1)
    seat_numbers = models.JSONField(
        _('seat numbers'),
        default=list,
        blank=True,
        help_text=_('List of reserved seat identifiers (e.g. ["A1", "A2"])')
    )
    total_price = models.DecimalField(
        _('total price'),
        max_digits=10,
        decimal_places=2
    )

    status = models.CharField(
        _('status'),
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    guest_email = models.EmailField(_('guest email'), blank=True)
    guest_phone = models.CharField(_('guest phone'), max_length=20, blank=True)

    notes = models.TextField(_('notes'), blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = _('reservation')
        verbose_name_plural = _('reservations')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} - {self.showtime.movie.title} ({self.created_at.date()})'

    def save(self, *args, **kwargs):
        if not self.total_price:
            self.total_price = self.showtime.price * self.num_seats
        super().save(*args, **kwargs)

    def confirm(self):
        from django.utils import timezone
        self.status = self.Status.CONFIRMED
        self.confirmed_at = timezone.now()
        self.save()

        # update seat count
        self.showtime.available_seats -= self.num_seats
        self.showtime.save()

        # create ticket for this reservation
        from apps.tickets.models import Ticket
        Ticket.objects.get_or_create(reservation=self)

        self.send_confirmation_email()

    def cancel(self):
        from django.utils import timezone
        prev_status = self.status
        self.status = self.Status.CANCELLED
        self.cancelled_at = timezone.now()
        self.save()

        # give seats back if it was confirmed
        if prev_status == self.Status.CONFIRMED:
            self.showtime.available_seats += self.num_seats
            self.showtime.save()

        self.send_cancellation_email()

    def send_confirmation_email(self):
        subject = f'Reservation Confirmed - {self.showtime.movie.title}'
        msg = (
            f'Dear {self.user.get_full_name()},\n\n'
            f'Your reservation has been confirmed!\n\n'
            f'Details:\n'
            f'- Movie: {self.showtime.movie.title}\n'
            f'- Cinema: {self.showtime.room.cinema.name}\n'
            f'- Room: {self.showtime.room.name}\n'
            f'- Date & Time: {self.showtime.start_time}\n'
            f'- Seats: {self.num_seats}\n'
            f'- Total: \u20ac{self.total_price}\n'
            f'- Reservation Code: {self.id}\n\n'
            f'Thank you for choosing us!'
        )
        try:
            send_mail(subject, msg, settings.DEFAULT_FROM_EMAIL,
                      [self.user.email], fail_silently=True)
        except Exception:
            pass

    def send_cancellation_email(self):
        subject = f'Reservation Cancelled - {self.showtime.movie.title}'
        msg = (
            f'Dear {self.user.get_full_name()},\n\n'
            f'Your reservation has been cancelled.\n\n'
            f'Details:\n'
            f'- Movie: {self.showtime.movie.title}\n'
            f'- Date & Time: {self.showtime.start_time}\n'
            f'- Reservation Code: {self.id}\n\n'
            f'If you did not request this cancellation, please contact us.'
        )
        try:
            send_mail(subject, msg, settings.DEFAULT_FROM_EMAIL,
                      [self.user.email], fail_silently=True)
        except Exception:
            pass

import uuid
from django.db import transaction
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings
from apps.notifications.email import send_email


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

    def confirm(self, changed_by=None, notes=''):
        from django.utils import timezone
        from apps.venues.models import Showtime
        from apps.tickets.models import Ticket

        if self.status == self.Status.CONFIRMED:
            return
        if self.status == self.Status.CANCELLED:
            raise ValueError('Cancelled reservations cannot be confirmed.')

        with transaction.atomic():
            showtime = Showtime.objects.select_for_update().get(pk=self.showtime_id)
            if not showtime.is_active or showtime.start_time <= timezone.now():
                raise ValueError('Showtime is no longer available.')
            if showtime.available_seats < self.num_seats:
                raise ValueError('Not enough seats available.')

            old_status = self.status
            self.status = self.Status.CONFIRMED
            self.confirmed_at = timezone.now()
            self.save()

            showtime.available_seats -= self.num_seats
            showtime.save()

            Ticket.objects.get_or_create(reservation=self)
            self.log_status_change(old_status, self.status, changed_by=changed_by, notes=notes)

        self.send_confirmation_email()

    def cancel(self, changed_by=None, notes=''):
        from django.utils import timezone
        from apps.venues.models import Showtime
        from apps.tickets.models import Ticket

        with transaction.atomic():
            previous_status = self.status
            if previous_status == self.Status.CANCELLED:
                return

            self.status = self.Status.CANCELLED
            self.cancelled_at = timezone.now()
            self.save()

            if previous_status == self.Status.CONFIRMED:
                showtime = Showtime.objects.select_for_update().get(pk=self.showtime_id)
                showtime.available_seats += self.num_seats
                showtime.save()

            ticket = getattr(self, 'ticket', None)
            if ticket and not ticket.checked_in and ticket.status != Ticket.Status.CANCELLED:
                ticket.status = Ticket.Status.CANCELLED
                ticket.save()

            self.log_status_change(
                previous_status,
                self.status,
                changed_by=changed_by,
                notes=notes
            )

        self.send_cancellation_email()

    def log_status_change(self, old_status, new_status, changed_by=None, notes=''):
        ReservationHistory.objects.create(
            reservation=self,
            old_status=old_status or '',
            new_status=new_status,
            changed_by=changed_by,
            notes=notes or ''
        )

    def send_confirmation_email(self):
        subject = f'Reservation Confirmed - {self.showtime.movie.title}'
        customer_name = self.user.get_full_name() or self.user.email
        seat_list = ', '.join(self.seat_numbers) if self.seat_numbers else str(self.num_seats)
        room_photo_url = ''
        if getattr(self.showtime.room, 'photo', None):
            try:
                room_photo_url = self.showtime.room.photo.url
                if room_photo_url and not room_photo_url.startswith('http'):
                    room_photo_url = f"{settings.BACKEND_URL.rstrip('/')}{room_photo_url}"
            except Exception:
                room_photo_url = ''

        text = (
            f'Dear {customer_name},\n\n'
            f'Your reservation has been confirmed.\n\n'
            f'Details:\n'
            f'- Movie: {self.showtime.movie.title}\n'
            f'- Cinema: {self.showtime.room.cinema.name}\n'
            f'- Room: {self.showtime.room.name}\n'
            f'- Room Description: {self.showtime.room.description or "-"}\n'
            f'- Date & Time: {self.showtime.start_time}\n'
            f'- Seats: {seat_list}\n'
            f'- Total: \u20ac{self.total_price}\n'
            f'- Reservation Code: {self.id}\n\n'
            f'Thank you for choosing us.'
        )
        html = (
            f"<p>Dear {customer_name},</p>"
            f"<p>Your reservation has been confirmed.</p>"
            f"<p><strong>Details</strong></p>"
            f"<ul>"
            f"<li><strong>Movie:</strong> {self.showtime.movie.title}</li>"
            f"<li><strong>Cinema:</strong> {self.showtime.room.cinema.name}</li>"
            f"<li><strong>Room:</strong> {self.showtime.room.name}</li>"
            f"<li><strong>Room Description:</strong> {self.showtime.room.description or '-'}</li>"
            f"<li><strong>Date &amp; Time:</strong> {self.showtime.start_time}</li>"
            f"<li><strong>Seats:</strong> {seat_list}</li>"
            f"<li><strong>Total:</strong> \u20ac{self.total_price}</li>"
            f"<li><strong>Reservation Code:</strong> {self.id}</li>"
            f"</ul>"
            f"{f'<p><img src=\"{room_photo_url}\" alt=\"Room photo\" style=\"max-width: 100%;\"></p>' if room_photo_url else ''}"
            f"<p>Thank you for choosing us.</p>"
        )

        recipients = [self.user.email]
        if self.guest_email:
            recipients.append(self.guest_email)
        send_email(to=recipients, subject=subject, html=html, text=text)

    def send_cancellation_email(self):
        subject = f'Reservation Cancelled - {self.showtime.movie.title}'
        customer_name = self.user.get_full_name() or self.user.email
        text = (
            f'Dear {customer_name},\n\n'
            f'Your reservation has been cancelled.\n\n'
            f'Details:\n'
            f'- Movie: {self.showtime.movie.title}\n'
            f'- Date & Time: {self.showtime.start_time}\n'
            f'- Reservation Code: {self.id}\n\n'
            f'If you did not request this cancellation, please contact us.'
        )
        html = (
            f"<p>Dear {customer_name},</p>"
            f"<p>Your reservation has been cancelled.</p>"
            f"<p><strong>Details</strong></p>"
            f"<ul>"
            f"<li><strong>Movie:</strong> {self.showtime.movie.title}</li>"
            f"<li><strong>Date &amp; Time:</strong> {self.showtime.start_time}</li>"
            f"<li><strong>Reservation Code:</strong> {self.id}</li>"
            f"</ul>"
            f"<p>If you did not request this cancellation, please contact us.</p>"
        )
        recipients = [self.user.email]
        if self.guest_email:
            recipients.append(self.guest_email)
        send_email(to=recipients, subject=subject, html=html, text=text)


class ReservationHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reservation = models.ForeignKey(
        Reservation,
        on_delete=models.CASCADE,
        related_name='history'
    )
    old_status = models.CharField(max_length=20, blank=True)
    new_status = models.CharField(max_length=20)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _('reservation history')
        verbose_name_plural = _('reservation histories')
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.reservation_id}: {self.old_status} -> {self.new_status}'

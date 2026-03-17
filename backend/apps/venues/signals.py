from django.db.models.signals import pre_delete, pre_save
from django.dispatch import receiver
from apps.notifications.email import send_email
from .models import Room, Movie, Showtime


def notify_affected_users(reservations, reason):
    for reservation in reservations:
        subject = f"Αλλαγη στην κρατηση σας - {reservation.showtime.movie.title}"
        text = (
            f"Αγαπητε/η {reservation.user.get_full_name()},\n\n"
            f"Η κρατηση σας για «{reservation.showtime.movie.title}» "
            f"στις {reservation.showtime.start_time} εχει επηρεαστει "
            f"({reason}).\n\n"
            f"Παρακαλω επικοινωνηστε μαζι μας.\n\n"
            f"Κωδικος κρατησης: {reservation.id}"
        )
        html = (
            f"<p>Αγαπητε/η {reservation.user.get_full_name()},</p>"
            f"<p>Η κρατηση σας για «{reservation.showtime.movie.title}» "
            f"στις {reservation.showtime.start_time} εχει επηρεαστει "
            f"({reason}).</p>"
            f"<p>Παρακαλω επικοινωνηστε μαζι μας.</p>"
            f"<p><strong>Κωδικος κρατησης:</strong> {reservation.id}</p>"
        )
        send_email(to=reservation.user.email, subject=subject, html=html, text=text)


@receiver(pre_delete, sender=Room)
def notify_room_deletion(sender, instance, **kwargs):
    from apps.reservations.models import Reservation
    reservations = Reservation.objects.filter(
        showtime__room=instance,
        status=Reservation.Status.CONFIRMED
    ).select_related('user', 'showtime', 'showtime__movie')
    notify_affected_users(reservations, f"Room {instance.name} is no longer available")


@receiver(pre_delete, sender=Movie)
def notify_movie_deletion(sender, instance, **kwargs):
    from apps.reservations.models import Reservation
    reservations = Reservation.objects.filter(
        showtime__movie=instance,
        status=Reservation.Status.CONFIRMED
    ).select_related('user', 'showtime', 'showtime__movie')
    notify_affected_users(reservations, f"Movie {instance.title} is no longer being shown")


@receiver(pre_save, sender=Room)
def notify_room_deactivation(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = Room.objects.get(pk=instance.pk)
        if old.is_active and not instance.is_active:
            from apps.reservations.models import Reservation
            reservations = Reservation.objects.filter(
                showtime__room=instance,
                status=Reservation.Status.CONFIRMED
            ).select_related('user', 'showtime', 'showtime__movie')
            notify_affected_users(reservations, f"Room {instance.name} has been deactivated")
    except Room.DoesNotExist:
        pass


@receiver(pre_save, sender=Movie)
def notify_movie_deactivation(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = Movie.objects.get(pk=instance.pk)
        if old.is_active and not instance.is_active:
            from apps.reservations.models import Reservation
            reservations = Reservation.objects.filter(
                showtime__movie=instance,
                status=Reservation.Status.CONFIRMED
            ).select_related('user', 'showtime', 'showtime__movie')
            notify_affected_users(reservations, f"Movie {instance.title} has been deactivated")
    except Movie.DoesNotExist:
        pass


@receiver(pre_delete, sender=Showtime)
def notify_showtime_deletion(sender, instance, **kwargs):
    from apps.reservations.models import Reservation
    from django.utils import timezone
    reservations = Reservation.objects.filter(
        showtime=instance,
        status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING],
        showtime__start_time__gte=timezone.now(),
    ).select_related('user', 'showtime', 'showtime__movie')
    notify_affected_users(
        reservations,
        f"Showtime for {instance.movie.title} on {instance.start_time:%d/%m/%Y %H:%M} has been cancelled"
    )


@receiver(pre_save, sender=Showtime)
def notify_showtime_deactivation(sender, instance, **kwargs):
    if not instance.pk:
        return
    try:
        old = Showtime.objects.get(pk=instance.pk)
        if old.is_active and not instance.is_active:
            from apps.reservations.models import Reservation
            from django.utils import timezone
            reservations = Reservation.objects.filter(
                showtime=instance,
                status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING],
                showtime__start_time__gte=timezone.now(),
            ).select_related('user', 'showtime', 'showtime__movie')
            notify_affected_users(
                reservations,
                f"Showtime for {instance.movie.title} on {instance.start_time:%d/%m/%Y %H:%M} has been deactivated"
            )
    except Showtime.DoesNotExist:
        pass

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.notifications.email import send_email
from .models import User


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    if not created:
        return
    if not instance.email:
        return

    full_name = instance.get_full_name() or instance.email
    login_url = f"{settings.FRONTEND_URL.rstrip('/')}/login"

    subject = "Welcome to our Cinema!"
    text = (
        f"Hi {full_name},\n\n"
        f"Welcome to our cinema booking platform.\n\n"
        f"You can sign in here: {login_url}\n\n"
        f"Enjoy your next movie!"
    )
    html = (
        f"<p>Hi {full_name},</p>"
        f"<p>Welcome to our cinema booking platform.</p>"
        f"<p>You can sign in here: <a href=\"{login_url}\">{login_url}</a></p>"
        f"<p>Enjoy your next movie!</p>"
    )

    send_email(to=instance.email, subject=subject, html=html, text=text)

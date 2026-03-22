import logging
from django.conf import settings
from django.core.mail import send_mail, EmailMultiAlternatives

logger = logging.getLogger(__name__)


def _normalize_recipients(to):
    if not to:
        return []
    if isinstance(to, (list, tuple, set)):
        return [email for email in to if email]
    return [to]


def send_email(*, to, subject, html, text=None, attachments=None):
    """Send an email with optional HTML and attachments.

    `attachments` should be an iterable of (filename, bytes, mimetype).
    Returns True on success, False on failure.
    """
    recipients = _normalize_recipients(to)
    if not recipients:
        return False

    from_email = settings.EMAIL_HOST_USER
    if not from_email:
        logger.warning("Email not configured. Missing EMAIL_HOST_USER.")
        return False

    try:
        if attachments:
            msg = EmailMultiAlternatives(subject=subject, body=text or '', from_email=from_email, to=recipients)
            if html:
                msg.attach_alternative(html, 'text/html')
            for name, content, mimetype in attachments:
                try:
                    msg.attach(name, content, mimetype)
                except Exception:
                    logger.exception('Failed attaching %s to email', name)
            msg.send(fail_silently=False)
            return True
        else:
            sent_count = send_mail(
                subject=subject,
                message=text or '',
                from_email=from_email,
                recipient_list=recipients,
                fail_silently=False,
                html_message=html,
            )
            return sent_count > 0
    except Exception:
        logger.exception("Failed to send email via SMTP to %s", recipients)
        return False

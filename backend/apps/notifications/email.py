import logging
import resend
from django.conf import settings

logger = logging.getLogger(__name__)


def _normalize_recipients(to):
    if not to:
        return []
    if isinstance(to, (list, tuple, set)):
        return [email for email in to if email]
    return [to]


def send_email(*, to, subject, html, text=None):
    recipients = _normalize_recipients(to)
    if not recipients:
        return False

    api_key = getattr(settings, 'RESEND_API_KEY', '')
    from_email = getattr(settings, 'RESEND_FROM_EMAIL', '')
    if not api_key or not from_email:
        logger.warning("Resend email not configured. Missing RESEND_API_KEY or RESEND_FROM_EMAIL.")
        return False

    resend.api_key = api_key

    payload = {
        "from": from_email,
        "to": recipients,
        "subject": subject,
        "html": html,
    }
    if text:
        payload["text"] = text

    try:
        resend.Emails.send(payload)
        return True
    except Exception:
        logger.exception("Failed to send email via Resend to %s", recipients)
        return False

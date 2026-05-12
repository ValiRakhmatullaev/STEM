"""
Helper to create notifications for users (event registration, job application, etc.).
"""
from apps.notifications.models import Notification, NotificationType


def create_notification(user, notification_type: str, title: str, message: str, link: str = ""):
    """Create a notification for the given user. Does not raise."""
    try:
        Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            message=message,
            link=(link or "").strip(),
        )
    except Exception:
        pass  # Do not block the main flow (e.g. registration)

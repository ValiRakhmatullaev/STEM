"""
Shared utilities for the events app.
"""
from apps.events.models import Event, EventRegistration, RegistrationStatus


def sync_event_counters(event: Event) -> None:
    """
    Recalculate registered_count and waitlist_count from DB to avoid drift.
    """
    active_regs = EventRegistration.objects.filter(
        event=event,
        status=RegistrationStatus.REGISTERED,
    )
    registered_count = active_regs.filter(is_waitlist=False).count()
    waitlist_count = active_regs.filter(is_waitlist=True).count()

    if event.registered_count != registered_count or event.waitlist_count != waitlist_count:
        event.registered_count = registered_count
        event.waitlist_count = waitlist_count
        event.save(update_fields=["registered_count", "waitlist_count"])

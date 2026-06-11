from __future__ import annotations

import logging
from dataclasses import dataclass

from django.conf import settings
from django.core.mail import send_mail
from django.db import IntegrityError, transaction
from django.db.models import F
from django.urls import reverse
from django.utils import timezone

from apps.events.models import Event, EventRegistration, RegistrationStatus

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class RegistrationResult:
    registration: EventRegistration
    created: bool
    is_waitlist: bool


def register_user_for_event(*, event_id: int, user) -> RegistrationResult:
    """
    Atomically register or re-register a user while enforcing capacity with a locked Event row.
    """

    with transaction.atomic():
        event = Event.objects.select_for_update().get(pk=event_id)
        reg = (
            EventRegistration.objects.select_for_update()
            .filter(event=event, user=user)
            .first()
        )
        if reg and reg.status == RegistrationStatus.REGISTERED:
            return RegistrationResult(registration=reg, created=False, is_waitlist=reg.is_waitlist)

        current_registered = (
            EventRegistration.objects.filter(
                event=event,
                status=RegistrationStatus.REGISTERED,
                is_waitlist=False,
            )
            .select_for_update()
            .count()
        )
        is_waitlist = current_registered >= event.capacity

        if reg:
            reg.status = RegistrationStatus.REGISTERED
            reg.is_waitlist = is_waitlist
            reg.cancelled_at = None
            reg.save(update_fields=["status", "is_waitlist", "cancelled_at"])
            created = False
        else:
            try:
                reg = EventRegistration.objects.create(
                    event=event,
                    user=user,
                    status=RegistrationStatus.REGISTERED,
                    is_waitlist=is_waitlist,
                )
                created = True
            except IntegrityError:
                reg = EventRegistration.objects.select_for_update().get(event=event, user=user)
                created = False

        _sync_locked_event_counters(event)
        return RegistrationResult(registration=reg, created=created, is_waitlist=is_waitlist)


def build_registration_confirmation_url(request, registration: EventRegistration) -> str:
    path = reverse("event-registration-confirm", args=[registration.email_confirmation_token])
    public_base = getattr(settings, "SITE_PUBLIC_BASE_URL", "").strip()
    if public_base:
        return public_base.rstrip("/") + path
    return request.build_absolute_uri(path)


def send_registration_confirmation_email(*, request, registration: EventRegistration) -> bool:
    registration = (
        EventRegistration.objects.select_related("event", "user")
        .get(pk=registration.pk)
    )
    recipient = (registration.user.email or "").strip()
    if not recipient:
        logger.warning("event_registration_confirmation_email_missing_recipient", extra={"registration_id": registration.pk})
        return False

    event_title = str(registration.event)
    confirm_url = build_registration_confirmation_url(request, registration)
    event_date = registration.event.date.strftime("%d %B %Y")
    event_time = registration.event.time.strftime("%I:%M %p")
    event_venue = "Online" if registration.event.is_online else (registration.event.location or "To be announced")
    participant_name = registration.user.display_name or registration.user.get_full_name() or registration.user.username
    subject = f"You’re In! Confirm Your Spot for “{event_title}” 🚀"
    message = (
        f"You’re In! Confirm Your Spot for “{event_title}” 🚀\n\n"
        f"Hello, {participant_name}!\n\n"
        f"We’re excited to welcome you to “{event_title}” — a powerful gathering of innovators, "
        "leaders, and changemakers shaping the future of AI and STEM.\n\n"
        "To secure your place, please confirm your registration by clicking the link below:\n\n"
        f"👉 {confirm_url}\n\n"
        "📅 Event Details:\n"
        f"Date: {event_date}\n"
        f"Time: {event_time}\n"
        f"Venue: {event_venue}\n\n"
        "Once confirmed, you’ll officially join a growing community empowering women and professionals "
        "in STEM and AI.\n\n"
        "If you did not request this registration, you can ignore this email.\n\n"
        "We look forward to seeing you there!\n\n"
        "Warm regards,\n"
        "STEM Woman Team 💫"
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None),
            recipient_list=[recipient],
            fail_silently=False,
        )
    except Exception:
        logger.exception(
            "event_registration_confirmation_email_failed",
            extra={"registration_id": registration.pk, "event_id": registration.event_id, "user_id": registration.user_id},
        )
        return False

    registration.confirmation_email_sent_at = timezone.now()
    registration.save(update_fields=["confirmation_email_sent_at"])
    logger.info(
        "event_registration_confirmation_email_sent",
        extra={"registration_id": registration.pk, "event_id": registration.event_id, "user_id": registration.user_id},
    )
    return True


def confirm_registration_by_email_token(*, token: str) -> EventRegistration | None:
    token = (token or "").strip().rstrip("/")
    if not token:
        return None
    token_candidates = {token}
    without_dashes = token.replace("-", "")
    if without_dashes:
        token_candidates.add(without_dashes)

    with transaction.atomic():
        registration = (
            EventRegistration.objects.select_for_update()
            .select_related("event", "user")
            .filter(email_confirmation_token__in=token_candidates)
            .first()
        )
        if registration is None or registration.status != RegistrationStatus.REGISTERED:
            return registration
        now = timezone.now()
        update_fields = []
        if not registration.organizer_confirmed:
            registration.organizer_confirmed = True
            update_fields.append("organizer_confirmed")
        if registration.email_confirmed_at is None:
            registration.email_confirmed_at = now
            update_fields.append("email_confirmed_at")
        if update_fields:
            registration.save(update_fields=update_fields)
        return registration


def cancel_event_registration(*, event_id: int, user) -> bool:
    with transaction.atomic():
        event = Event.objects.select_for_update().get(pk=event_id)
        reg = (
            EventRegistration.objects.select_for_update()
            .filter(event=event, user=user, status=RegistrationStatus.REGISTERED)
            .first()
        )
        if not reg:
            return False
        reg.status = RegistrationStatus.CANCELLED
        reg.cancelled_at = timezone.now()
        reg.save(update_fields=["status", "cancelled_at"])
        _sync_locked_event_counters(event)
    return True


def check_in_registration(*, registration_id: int, checker_user) -> tuple[EventRegistration, bool]:
    """
    Atomically check a registration in. Returns (registration, changed).
    """

    with transaction.atomic():
        registration = (
            EventRegistration.objects.select_for_update()
            .select_related("user", "event")
            .get(pk=registration_id)
        )
        if registration.checked_in:
            return registration, False

        now = timezone.now()
        registration.checked_in = True
        registration.checked_in_at = now
        registration.last_visit_at = now
        registration.visits_count = F("visits_count") + 1
        registration.save(update_fields=["checked_in", "checked_in_at", "last_visit_at", "visits_count"])
        registration.refresh_from_db(fields=["visits_count", "checked_in", "checked_in_at", "last_visit_at"])

        user = registration.user
        if not user.is_verified:
            total_checkins = EventRegistration.objects.filter(user=user, checked_in=True).count()
            if total_checkins >= 3:
                user.is_verified = True
                user.verified_at = now
                user.save(update_fields=["is_verified", "verified_at"])

        logger.info(
            "event_registration_checked_in",
            extra={
                "registration_id": registration.pk,
                "event_id": registration.event_id,
                "user_id": registration.user_id,
                "checker_id": getattr(checker_user, "pk", None),
            },
        )
        return registration, True


def _sync_locked_event_counters(event: Event) -> None:
    active_regs = EventRegistration.objects.filter(event=event, status=RegistrationStatus.REGISTERED)
    registered_count = active_regs.filter(is_waitlist=False).count()
    waitlist_count = active_regs.filter(is_waitlist=True).count()
    Event.objects.filter(pk=event.pk).update(registered_count=registered_count, waitlist_count=waitlist_count)

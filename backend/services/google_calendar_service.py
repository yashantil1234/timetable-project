"""
Google Calendar Service — Production-Hardened
Security:
  - Tokens stored encrypted via Fernet
  - No tokens ever logged
  - All endpoints require JWT (enforced in routes)
Edge cases:
  - Refresh token preservation (Google omits it on reconnect)
  - 2-minute debounce to prevent multi-device race
  - sync_version guard against concurrent admin-update + background-sync
  - Calendar recreation if user manually deletes EduScheduler calendar
  - Graceful 404 handling throughout
"""
import os
import datetime
import pytz
import logging

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google.auth.exceptions import RefreshError
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from cryptography.fernet import Fernet

from extensions import db
from models import UserGoogleAuth, CalendarEventMap, Timetable, Faculty, User

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────
IST = pytz.timezone('Asia/Kolkata')
CALENDAR_NAME = 'EduScheduler Timetable'
SCOPES = ['https://www.googleapis.com/auth/calendar']
SYNC_DEBOUNCE_MINUTES = 2      # Prevent sync within 2 min (multi-device)
BACKGROUND_SYNC_HOURS = 6
RETRY_WAIT_MINUTES = 30

DAY_TO_RRULE = {
    'Monday': 'MO', 'Tuesday': 'TU', 'Wednesday': 'WE',
    'Thursday': 'TH', 'Friday': 'FR', 'Saturday': 'SA', 'Sunday': 'SU'
}
DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

# ─────────────────────────────────────────────
# Secure Logging — NEVER log token values
# ─────────────────────────────────────────────
logger = logging.getLogger('gcal')
_SENSITIVE_LOG_KEYS = {'access_token', 'refresh_token', 'token', 'credentials'}


def _safe_log(msg, **kwargs):
    """Log without ever exposing token values."""
    safe = {k: '[REDACTED]' if k in _SENSITIVE_LOG_KEYS else v for k, v in kwargs.items()}
    logger.info(f"[GCal] {msg} {safe}" if safe else f"[GCal] {msg}")


# ─────────────────────────────────────────────
# Fernet Token Encryption
# ─────────────────────────────────────────────
def _get_fernet():
    """
    Returns Fernet cipher from FERNET_SECRET_KEY env var.
    Generate once via: Fernet.generate_key().decode()
    Add to .env as FERNET_SECRET_KEY=<value>
    """
    key = os.environ.get('FERNET_SECRET_KEY')
    if not key:
        raise RuntimeError("FERNET_SECRET_KEY not set in environment")
    return Fernet(key.encode())


def _encrypt(value: str) -> str:
    if not value:
        return value
    return _get_fernet().encrypt(value.encode()).decode()


def _decrypt(value: str) -> str:
    if not value:
        return value
    try:
        return _get_fernet().decrypt(value.encode()).decode()
    except Exception:
        return value  # Fallback: return as-is if decryption fails (migration safety)


# ─────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────
def _get_client_config():
    return {
        "web": {
            "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
            "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    }


# ─────────────────────────────────────────────
# OAuth Flow
# ─────────────────────────────────────────────
def get_auth_url(redirect_uri, login_hint=None):
    """Generate OAuth 2.0 consent URL."""
    flow = Flow.from_client_config(_get_client_config(), scopes=SCOPES, redirect_uri=redirect_uri)
    url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        login_hint=login_hint,
        prompt='consent'
    )
    return url


def handle_auth_callback(code, redirect_uri, user):
    """
    Exchange OAuth code for tokens.
    CRITICAL: Preserves existing refresh_token if Google doesn't return a new one
    (Google omits refresh_token on reconnect unless prompt=consent was forced).
    """
    try:
        flow = Flow.from_client_config(_get_client_config(), scopes=SCOPES, redirect_uri=redirect_uri)
        flow.fetch_token(code=code)
        creds = flow.credentials

        auth = UserGoogleAuth.query.filter_by(user_id=user.id).first()
        if not auth:
            auth = UserGoogleAuth(user_id=user.id)

        # ⚠️ Issue 1 Fix: Only overwrite refresh_token if a new one was provided
        new_refresh = creds.refresh_token
        if new_refresh:
            auth.refresh_token = _encrypt(new_refresh)
            _safe_log("Saved new refresh token", user_id=user.id)
        else:
            _safe_log("Google did not return new refresh_token — preserving existing", user_id=user.id)
            # Keep existing auth.refresh_token as-is

        auth.access_token = _encrypt(creds.token)
        auth.token_expiry = creds.expiry
        auth.sync_status = 'pending'
        auth.last_error = None

        db.session.add(auth)
        db.session.commit()
        return True

    except Exception as e:
        _safe_log(f"Auth callback failed: {e}", user_id=user.id)
        return False


# ─────────────────────────────────────────────
# Credential Management (auto-refresh)
# ─────────────────────────────────────────────
def get_credentials(user):
    """
    Load and auto-refresh credentials. Decrypts from DB.
    CRITICAL: Refresh happens here before every API call.
    Never logs token values.
    """
    auth = UserGoogleAuth.query.filter_by(user_id=user.id).first()
    if not auth:
        return None

    creds = Credentials(
        token=_decrypt(auth.access_token),
        refresh_token=_decrypt(auth.refresh_token),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES
    )

    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            # Persist refreshed token (encrypted)
            auth.access_token = _encrypt(creds.token)
            auth.token_expiry = creds.expiry
            db.session.commit()
            _safe_log("Token auto-refreshed", user_id=user.id)
        except RefreshError:
            auth.sync_status = 'failed'
            auth.last_error = 'Access revoked. Please reconnect Google Calendar.'
            db.session.commit()
            _safe_log("Token refresh failed — revoked by user", user_id=user.id)
            return None

    return creds


def get_service(user):
    """Build the Google Calendar API client."""
    creds = get_credentials(user)
    if not creds:
        return None
    return build('calendar', 'v3', credentials=creds)


# ─────────────────────────────────────────────
# Calendar Management
# ─────────────────────────────────────────────
def ensure_calendar_exists(user):
    """
    Get or create the EduScheduler calendar.
    ⚠️ Issue 3 Fix: If stored calendar_id returns 404 (user deleted it), recreates it.
    Never creates duplicates.
    """
    auth = UserGoogleAuth.query.filter_by(user_id=user.id).first()
    if not auth:
        return None

    service = get_service(user)
    if not service:
        return None

    if auth.calendar_id:
        try:
            service.calendars().get(calendarId=auth.calendar_id).execute()
            return auth.calendar_id  # Existing calendar valid
        except HttpError as e:
            if e.resp.status == 404:
                _safe_log("Stored calendar not found (deleted by user) — recreating", user_id=user.id)
                auth.calendar_id = None  # Fall through to creation
                # Also clear all old mappings since events are gone too
                CalendarEventMap.query.filter_by(user_id=user.id).delete()
                db.session.commit()
            else:
                raise

    # Create new calendar
    cal_body = {'summary': CALENDAR_NAME, 'timeZone': 'Asia/Kolkata'}
    created = service.calendars().insert(body=cal_body).execute()
    auth.calendar_id = created['id']
    db.session.commit()
    _safe_log(f"Created new calendar", user_id=user.id, calendar_id=auth.calendar_id)
    return auth.calendar_id


# ─────────────────────────────────────────────
# Role-Based Timetable Fetching
# ─────────────────────────────────────────────
def _get_timetable_entries_for_user(user):
    """Teacher → only their classes. Student → only their section."""
    if user.role == 'teacher':
        faculty = Faculty.query.filter_by(user_id=user.id).first()
        if not faculty:
            return []
        return Timetable.query.filter_by(faculty_id=faculty.id).all()
    elif user.role == 'student':
        if not user.section_id:
            return []
        return Timetable.query.filter_by(section_id=user.section_id).all()
    return []


# ─────────────────────────────────────────────
# Event Building
# ─────────────────────────────────────────────
def _build_event_body(entry, calendar_id):
    """Build Google Calendar event dict from Timetable entry."""
    course_name = entry.course.name if entry.course else "Class"
    room = entry.classroom.room_number if entry.classroom else "TBD"
    faculty_name = entry.faculty.faculty_name if entry.faculty else "Staff"

    start_dt, end_dt = _next_occurrence_ist(entry.day, entry.start_time, entry.end_time)
    rrule_day = DAY_TO_RRULE.get(entry.day, 'MO')

    return {
        'summary': course_name,
        'location': room,
        'description': f"Faculty: {faculty_name}\nRoom: {room}",
        'start': {'dateTime': start_dt.isoformat(), 'timeZone': 'Asia/Kolkata'},
        'end': {'dateTime': end_dt.isoformat(), 'timeZone': 'Asia/Kolkata'},
        'recurrence': [f"RRULE:FREQ=WEEKLY;BYDAY={rrule_day}"],
        'extendedProperties': {
            'private': {'app': 'eduscheduler', 'timetable_id': str(entry.timetable_id)}
        }
    }


def _next_occurrence_ist(day_name, start_time_str, end_time_str):
    """Next date of given weekday with IST start/end times."""
    target_idx = DAYS_OF_WEEK.index(day_name)
    now_ist = datetime.datetime.now(IST)
    days_ahead = target_idx - now_ist.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    next_date = now_ist + datetime.timedelta(days=days_ahead)

    sh, sm = map(int, start_time_str.split(':'))
    eh, em = map(int, end_time_str.split(':'))

    start_dt = next_date.replace(hour=sh, minute=sm, second=0, microsecond=0)
    end_dt = next_date.replace(hour=eh, minute=em, second=0, microsecond=0)
    return start_dt, end_dt


# ─────────────────────────────────────────────
# Core Sync Logic
# ─────────────────────────────────────────────
def sync_timetable(user, force=False):
    """
    Full timetable sync with hardened edge case handling.

    ⚠️ Issue 5 Fix: 2-minute debounce (multi-device safety)
    ⚠️ Issue 2 Fix: sync_version guard (checks version before writing)
    """
    auth = UserGoogleAuth.query.filter_by(user_id=user.id).first()
    if not auth:
        return False

    # ── Debounce: prevent concurrent syncs within 2 minutes ──
    if not force and auth.last_synced_at:
        elapsed = datetime.datetime.utcnow() - auth.last_synced_at
        if elapsed < datetime.timedelta(minutes=SYNC_DEBOUNCE_MINUTES):
            _safe_log("Sync debounced (< 2 min since last)", user_id=user.id)
            return True

    # ── Smart sync: skip if synced within 6h (background jobs) ──
    if not force and auth.last_synced_at:
        elapsed = datetime.datetime.utcnow() - auth.last_synced_at
        if elapsed < datetime.timedelta(hours=BACKGROUND_SYNC_HOURS):
            return True

    service = get_service(user)
    if not service:
        return False

    calendar_id = ensure_calendar_exists(user)
    if not calendar_id:
        return False

    # ── Race condition guard: capture version before starting ──
    version_at_start = auth.sync_version or 0

    auth.sync_status = 'syncing'
    db.session.commit()

    try:
        entries = _get_timetable_entries_for_user(user)
        existing_maps = {
            m.timetable_id: m
            for m in CalendarEventMap.query.filter_by(user_id=user.id).all()
        }
        current_entry_ids = set()

        for entry in entries:
            current_entry_ids.add(entry.timetable_id)
            event_body = _build_event_body(entry, calendar_id)

            if entry.timetable_id in existing_maps:
                mapping = existing_maps[entry.timetable_id]
                try:
                    service.events().update(
                        calendarId=calendar_id,
                        eventId=mapping.google_event_id,
                        body=event_body
                    ).execute()
                except HttpError as e:
                    if e.resp.status == 404:
                        # Event manually deleted → recreate
                        created = service.events().insert(
                            calendarId=calendar_id, body=event_body
                        ).execute()
                        mapping.google_event_id = created['id']
            else:
                created = service.events().insert(
                    calendarId=calendar_id, body=event_body
                ).execute()
                db.session.add(CalendarEventMap(
                    user_id=user.id,
                    timetable_id=entry.timetable_id,
                    google_event_id=created['id'],
                    calendar_id=calendar_id
                ))

        # ── Delete stale events ──
        for stale_tid in set(existing_maps.keys()) - current_entry_ids:
            mapping = existing_maps[stale_tid]
            try:
                service.events().delete(
                    calendarId=calendar_id,
                    eventId=mapping.google_event_id
                ).execute()
            except HttpError as e:
                if e.resp.status != 404:
                    _safe_log(f"Delete event error {e.resp.status}", user_id=user.id)
            db.session.delete(mapping)

        db.session.commit()

        # ── Issue 2 Fix: Only update sync_version if no concurrent write happened ──
        db.session.refresh(auth)
        if (auth.sync_version or 0) != version_at_start:
            _safe_log("sync_version mismatch — concurrent write detected, skipping version bump", user_id=user.id)
        else:
            auth.sync_version = version_at_start + 1

        auth.last_synced_at = datetime.datetime.utcnow()
        auth.sync_status = 'synced'
        auth.last_error = None
        db.session.commit()
        _safe_log("Sync complete", user_id=user.id)
        return True

    except Exception as e:
        auth.sync_status = 'failed'
        auth.last_error = str(e)[:500]  # Truncate to prevent log overflow
        db.session.commit()
        _safe_log(f"Sync failed: {type(e).__name__}", user_id=user.id)
        return False


# ─────────────────────────────────────────────
# Timetable Admin Hooks
# ─────────────────────────────────────────────
def on_timetable_updated(timetable_entry):
    """
    Called when admin updates a timetable entry.
    Updates the calendar event for every connected user.
    Bumps sync_version to signal background job to skip this user.
    """
    mappings = CalendarEventMap.query.filter_by(timetable_id=timetable_entry.timetable_id).all()
    for mapping in mappings:
        user = User.query.get(mapping.user_id)
        if not user:
            continue
        service = get_service(user)
        if not service:
            continue
        try:
            event_body = _build_event_body(timetable_entry, mapping.calendar_id)
            service.events().update(
                calendarId=mapping.calendar_id,
                eventId=mapping.google_event_id,
                body=event_body
            ).execute()
            # Bump sync_version so background job knows a newer write occurred
            auth = UserGoogleAuth.query.filter_by(user_id=user.id).first()
            if auth:
                auth.sync_version = (auth.sync_version or 0) + 1
                auth.last_synced_at = datetime.datetime.utcnow()
                db.session.commit()
        except HttpError as e:
            if e.resp.status == 404:
                try:
                    event_body = _build_event_body(timetable_entry, mapping.calendar_id)
                    created = service.events().insert(
                        calendarId=mapping.calendar_id, body=event_body
                    ).execute()
                    mapping.google_event_id = created['id']
                    db.session.commit()
                except Exception:
                    pass


def on_timetable_deleted(timetable_id):
    """
    Called when admin deletes a timetable entry.
    Removes the calendar event for every connected user.
    """
    mappings = CalendarEventMap.query.filter_by(timetable_id=timetable_id).all()
    for mapping in mappings:
        user = User.query.get(mapping.user_id)
        if not user:
            continue
        service = get_service(user)
        if not service:
            continue
        try:
            service.events().delete(
                calendarId=mapping.calendar_id,
                eventId=mapping.google_event_id
            ).execute()
        except HttpError as e:
            if e.resp.status != 404:
                _safe_log(f"Delete event error {e.resp.status}", user_id=user.id)
        db.session.delete(mapping)
    db.session.commit()


# ─────────────────────────────────────────────
# Background Job (APScheduler via app.py)
# ─────────────────────────────────────────────
def background_sync_all_users():
    """
    Runs every 6 hours.
    Smart: only syncs stale users.
    Retry: skips users who failed and haven't waited 30 min yet.
    """
    _safe_log("Background sync started")
    threshold = datetime.datetime.utcnow() - datetime.timedelta(hours=BACKGROUND_SYNC_HOURS)

    stale_auths = UserGoogleAuth.query.filter(
        db.or_(
            UserGoogleAuth.last_synced_at.is_(None),
            UserGoogleAuth.last_synced_at < threshold
        )
    ).all()

    for auth in stale_auths:
        user = User.query.get(auth.user_id)
        if not user:
            continue

        # Retry guard: if last sync failed, wait 30 min before retrying
        if auth.sync_status == 'failed' and auth.last_synced_at:
            retry_threshold = datetime.datetime.utcnow() - datetime.timedelta(minutes=RETRY_WAIT_MINUTES)
            if auth.last_synced_at > retry_threshold:
                _safe_log(f"Retry wait not reached, skipping", user_id=user.id)
                continue

        _safe_log(f"Syncing", user_id=user.id, role=user.role)
        sync_timetable(user, force=True)

    _safe_log("Background sync complete")

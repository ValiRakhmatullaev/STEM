# -*- coding: utf-8 -*-
"""
Google Sheets integration for event registrations.

SETUP INSTRUCTIONS
==================

1. Create a Google Cloud Service Account:
   - Go to https://console.cloud.google.com/
   - Select or create a project.
   - Navigate to "APIs & Services" → "Credentials".
   - Click "Create Credentials" → "Service account".
   - Give it a name (e.g. "Event Registrations"), then "Create and Continue".
   - Skip optional steps (or add roles if needed), then "Done".
   - Click the created service account → "Keys" tab → "Add Key" → "Create new key"
     → choose "JSON" → download. Rename the file to `google_credentials.json`.

2. Enable APIs:
   - Go to "APIs & Services" → "Library".
   - Enable "Google Sheets API" and "Google Drive API".

3. Place credentials:
   - Put `google_credentials.json` in the project root (same folder as manage.py).
   - Or set env var GOOGLE_CREDENTIALS_PATH to the full path of the JSON file.

4. Create and share the spreadsheet:
   - In Google Drive create a new spreadsheet and name it exactly: "Event Registrations".
   - Open it → Share → add the service account email (from the JSON, field "client_email",
     e.g. something@project-id.iam.gserviceaccount.com) as Editor.
   - The first sheet in the workbook will be used for appending rows.

5. Optional: add a header row in the first row of the sheet:
   Event ID | Event Title | Event Date | Event Time | User Full Name | User Email | Username
"""

import logging
from pathlib import Path

import gspread
from google.oauth2.service_account import Credentials

# Path to credentials file: project root or from environment
from django.conf import settings

logger = logging.getLogger(__name__)

# Scopes required to open spreadsheets by name and append rows
_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]

# Cached client so we don't re-authenticate on every request
_gspread_client = None


def _get_credentials():
    """Load service account credentials from JSON file."""
    import os
    path = os.environ.get("GOOGLE_CREDENTIALS_PATH")
    if path:
        path = Path(path)
    else:
        path = settings.BASE_DIR / "google_credentials.json"
    if not path.exists():
        raise FileNotFoundError(f"Google credentials not found at {path}")
    return Credentials.from_service_account_file(str(path), scopes=_SCOPES)


def get_sheet():
    """
    Return the first worksheet of the "Event Registrations" spreadsheet.
    Uses a cached gspread client for efficiency.
    """
    global _gspread_client
    if _gspread_client is None:
        creds = _get_credentials()
        _gspread_client = gspread.authorize(creds)
    spreadsheet = _gspread_client.open("Event Registrations")
    return spreadsheet.sheet1


def add_registration_row(event, user):
    """
    Append one row to the Event Registrations sheet for the given event and user.

    Row format: [Event ID, Event Title, Event Date, Event Time, User Full Name, User Email, Username]

    If the Google Sheets API fails, the exception is logged and not re-raised,
    so that the Django registration flow can still succeed.
    """
    try:
        sheet = get_sheet()
        full_name = user.get_full_name() or ""
        email = user.email or ""
        username = user.username or ""
        # Ensure date/time are strings for the sheet
        event_date = str(event.date) if event.date else ""
        event_time = str(event.time) if event.time else ""
        row = [
            event.id,
            event.title,
            event_date,
            event_time,
            full_name,
            email,
            username,
        ]
        sheet.append_row(row, value_input_option="USER_ENTERED")
        logger.info("Appended event registration to Google Sheets: event_id=%s user_id=%s", event.id, user.pk)
    except FileNotFoundError as e:
        logger.warning("Google Sheets skipped (no credentials): %s", e)
    except gspread.exceptions.APIError as e:
        logger.exception("Google Sheets API error while appending registration: %s", e)
    except Exception as e:
        logger.exception("Unexpected error syncing registration to Google Sheets: %s", e)

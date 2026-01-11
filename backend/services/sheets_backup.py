"""
Google Sheets backup service for video metadata.
Appends video data to a Google Sheet for redundant storage.
"""

import os
import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
from typing import Optional

# Sheet column headers
HEADERS = [
    "Video ID",
    "Title",
    "Summary",
    "Tags",
    "Transcript",
    "Created At",
    "Processed At"
]

# Google Sheets API scopes
SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive"
]


def get_sheets_client() -> Optional[gspread.Client]:
    """Initialize gspread client using service account credentials."""
    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not creds_path:
        print("No GOOGLE_APPLICATION_CREDENTIALS set, sheets backup disabled")
        return None

    try:
        credentials = Credentials.from_service_account_file(creds_path, scopes=SCOPES)
        return gspread.authorize(credentials)
    except Exception as e:
        print(f"Failed to initialize sheets client: {e}")
        return None


def ensure_headers(sheet: gspread.Worksheet) -> None:
    """Ensure the sheet has headers in the first row."""
    try:
        first_row = sheet.row_values(1)
        if not first_row or first_row != HEADERS:
            sheet.update("A1:G1", [HEADERS])
    except Exception as e:
        print(f"Failed to set headers: {e}")


def backup_video_to_sheet(
    video_id: str,
    title: str,
    summary: str,
    tags: list[str],
    transcript: str,
    created_at: datetime,
    processed_at: datetime
) -> bool:
    """
    Append video metadata to Google Sheet.

    Returns True if successful, False otherwise.
    Failures are logged but don't raise exceptions.
    """
    sheet_id = os.getenv("GOOGLE_SHEET_ID")
    if not sheet_id:
        print("No GOOGLE_SHEET_ID set, skipping sheets backup")
        return False

    client = get_sheets_client()
    if not client:
        return False

    try:
        spreadsheet = client.open_by_key(sheet_id)
        sheet = spreadsheet.sheet1  # Use first sheet

        # Ensure headers exist
        ensure_headers(sheet)

        # Format data for the row
        row_data = [
            video_id,
            title,
            summary,
            ", ".join(tags) if tags else "",
            transcript[:50000] if transcript else "",  # Limit transcript length
            created_at.isoformat() if created_at else "",
            processed_at.isoformat() if processed_at else ""
        ]

        # Append the row
        sheet.append_row(row_data, value_input_option="RAW")
        print(f"Successfully backed up video {video_id} to Google Sheet")
        return True

    except gspread.SpreadsheetNotFound:
        print(f"Spreadsheet {sheet_id} not found. Make sure it's shared with the service account.")
        return False
    except gspread.exceptions.APIError as e:
        print(f"Google Sheets API error: {e}")
        return False
    except Exception as e:
        print(f"Failed to backup to sheets: {e}")
        return False

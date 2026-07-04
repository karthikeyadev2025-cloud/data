"""Google Sheets export module.

Creates a new Google Sheet with search results and returns the shareable URL.
Requires a Google Service Account JSON key configured in admin settings.
"""
import json
import logging
from typing import Optional

log = logging.getLogger("gsheets")


def _get_credentials(service_account_json: str):
    """Build credentials from service account JSON string."""
    from google.oauth2.service_account import Credentials
    info = json.loads(service_account_json)
    scopes = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
    return Credentials.from_service_account_info(info, scopes=scopes)


def export_to_sheet(rows: list[dict], title: str, service_account_json: str,
                    share_email: Optional[str] = None) -> str:
    """
    Create a new Google Sheet with the given rows.
    Returns the shareable URL.
    """
    from googleapiclient.discovery import build

    creds = _get_credentials(service_account_json)
    sheets_service = build("sheets", "v4", credentials=creds)
    drive_service = build("drive", "v3", credentials=creds)

    # Define columns
    columns = ["name", "phone", "email", "website", "address", "city",
               "category", "rating", "reviews_count",
               "instagram", "facebook", "linkedin", "twitter", "youtube", "whatsapp"]

    # Create spreadsheet
    spreadsheet = sheets_service.spreadsheets().create(body={
        "properties": {"title": title},
        "sheets": [{
            "properties": {
                "title": "Leads",
                "gridProperties": {"frozenRowCount": 1}
            }
        }]
    }).execute()

    spreadsheet_id = spreadsheet["spreadsheetId"]
    sheet_url = spreadsheet["spreadsheetUrl"]

    # Prepare data: header row + data rows
    header = [col.replace("_", " ").title() for col in columns]
    values = [header]
    for row in rows:
        values.append([str(row.get(col) or "") for col in columns])

    # Write data
    sheets_service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range="Leads!A1",
        valueInputOption="RAW",
        body={"values": values}
    ).execute()

    # Format header row (bold, background color)
    sheets_service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body={
        "requests": [
            {
                "repeatCell": {
                    "range": {"sheetId": 0, "startRowIndex": 0, "endRowIndex": 1},
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": {"red": 0.055, "green": 0.647, "blue": 0.643, "alpha": 1},
                            "textFormat": {"bold": True, "foregroundColor": {"red": 1, "green": 1, "blue": 1}},
                        }
                    },
                    "fields": "userEnteredFormat(backgroundColor,textFormat)"
                }
            },
            {
                "autoResizeDimensions": {
                    "dimensions": {"sheetId": 0, "dimension": "COLUMNS", "startIndex": 0, "endIndex": len(columns)}
                }
            }
        ]
    }).execute()

    # Make publicly accessible (anyone with link can view)
    drive_service.permissions().create(
        fileId=spreadsheet_id,
        body={"type": "anyone", "role": "reader"},
        fields="id"
    ).execute()

    # Optionally share with a specific email
    if share_email:
        try:
            drive_service.permissions().create(
                fileId=spreadsheet_id,
                body={"type": "user", "role": "writer", "emailAddress": share_email},
                fields="id",
                sendNotificationEmail=False
            ).execute()
        except Exception as e:
            log.warning(f"Could not share with {share_email}: {e}")

    log.info(f"Created Google Sheet: {sheet_url}")
    return sheet_url

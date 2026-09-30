"""Google Docs, Slides, Sheets and remote document downloader/exporter."""

import re
import httpx
from typing import Tuple, Optional


# Regex patterns for Google Drive / Docs / Slides
DOCS_PATTERN = re.compile(r"docs\.google\.com/document/d/([a-zA-Z0-9_-]+)")
SLIDES_PATTERN = re.compile(r"docs\.google\.com/presentation/d/([a-zA-Z0-9_-]+)")
SHEETS_PATTERN = re.compile(r"docs\.google\.com/spreadsheets/d/([a-zA-Z0-9_-]+)")
DRIVE_PATTERN = re.compile(r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)")


def resolve_google_export_url(url: str) -> Optional[Tuple[str, str]]:
    """Resolves a Google Docs / Slides / Sheets / Drive URL into a direct PDF export URL.
    
    Returns (export_url, doc_type_name) or None if not a recognized Google URL.
    """
    url_str = url.strip()

    # Google Docs
    match = DOCS_PATTERN.search(url_str)
    if match:
        doc_id = match.group(1)
        return f"https://docs.google.com/document/d/{doc_id}/export?format=pdf", "Google Docs"

    # Google Slides
    match = SLIDES_PATTERN.search(url_str)
    if match:
        doc_id = match.group(1)
        return f"https://docs.google.com/presentation/d/{doc_id}/export/pdf", "Google Slides"

    # Google Sheets
    match = SHEETS_PATTERN.search(url_str)
    if match:
        doc_id = match.group(1)
        return f"https://docs.google.com/spreadsheets/d/{doc_id}/export?format=pdf", "Google Sheets"

    # Google Drive File
    match = DRIVE_PATTERN.search(url_str)
    if match:
        doc_id = match.group(1)
        return f"https://drive.google.com/uc?export=download&id={doc_id}", "Google Drive File"

    return None


async def fetch_document_from_url(url: str, timeout_seconds: float = 30.0) -> Tuple[bytes, str]:
    """Downloads a document from a Google link or direct web URL, returning (pdf_bytes, filename).
    
    Raises ValueError with user-friendly error messages if the document cannot be accessed.
    """
    resolved = resolve_google_export_url(url)
    target_url = resolved[0] if resolved else url.strip()
    doc_type = resolved[1] if resolved else "Remote Document"

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(follow_redirects=True, timeout=timeout_seconds) as client:
        try:
            response = await client.get(target_url, headers=headers)
        except httpx.RequestError as exc:
            raise ValueError(f"Failed to connect to {target_url}: {str(exc)}")

    # Check status
    if response.status_code == 404:
        raise ValueError(f"The document was not found (404). Please verify the link.")
    elif response.status_code in (401, 403):
        raise ValueError(
            f"Access denied ({response.status_code}) to this {doc_type}. "
            "Please ensure the document's sharing setting is set to 'Anyone with the link can view'."
        )
    elif response.status_code != 200:
        raise ValueError(f"Failed to fetch document. Server returned status code {response.status_code}.")

    content = response.content

    # Verify if Google redirected to a login page instead of PDF
    if b"accounts.google.com" in content[:2000] and b"<html" in content[:500]:
        raise ValueError(
            f"Google requested authentication for this {doc_type}. "
            "Please change the document sharing permission to 'Anyone with the link' and try again."
        )

    # Determine filename
    filename = "document.pdf"
    content_disposition = response.headers.get("content-disposition", "")
    if "filename=" in content_disposition:
        match = re.search(r'filename="?([^";]+)"?', content_disposition)
        if match:
            filename = match.group(1)
    else:
        if resolved:
            filename = f"{resolved[1].lower().replace(' ', '_')}.pdf"

    return content, filename

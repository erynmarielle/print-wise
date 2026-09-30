"""Automated tests for PDF color analysis, paper size detection, and pricing rules."""

import io
import pytest
from reportlab.lib.pagesizes import letter, legal
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.pricing import (
    PaperSize, ColorTier, PricingConfig, DEFAULT_PRICING,
    classify_page_tier, calculate_page_price
)
from app.analyzer import detect_paper_size, analyze_pdf_document
from app.downloader import resolve_google_export_url


def test_paper_size_detection():
    # 72 points per inch
    # Letter: 8.5 x 11 in -> 612 x 792 pt
    assert detect_paper_size(612, 792) == PaperSize.SHORT
    # Letter Landscape
    assert detect_paper_size(792, 612) == PaperSize.SHORT
    # A4: 595.28 x 841.89 pt
    assert detect_paper_size(595.3, 841.9) == PaperSize.A4
    # Folio / Long: 8.5 x 13 in -> 612 x 936 pt
    assert detect_paper_size(612, 936) == PaperSize.LONG
    # Legal: 8.5 x 14 in -> 612 x 1008 pt
    assert detect_paper_size(612, 1008) == PaperSize.LONG


def test_pricing_classification_and_calc():
    cfg = PricingConfig()
    
    # Monochrome
    assert classify_page_tier(0.0, cfg) == ColorTier.MONO
    assert calculate_page_price(ColorTier.MONO, PaperSize.SHORT, config=cfg) == 3.00
    assert calculate_page_price(ColorTier.MONO, PaperSize.LONG, config=cfg) == 4.00  # +1 long surcharge

    # Accent (< 5%)
    assert classify_page_tier(2.1, cfg) == ColorTier.ACCENT
    assert calculate_page_price(ColorTier.ACCENT, PaperSize.SHORT, config=cfg) == 5.00

    # Medium (5% - 25%)
    assert classify_page_tier(15.0, cfg) == ColorTier.MEDIUM
    assert calculate_page_price(ColorTier.MEDIUM, PaperSize.SHORT, config=cfg) == 8.00

    # Photo (> 25%)
    assert classify_page_tier(45.0, cfg) == ColorTier.PHOTO
    assert calculate_page_price(ColorTier.PHOTO, PaperSize.SHORT, config=cfg) == 15.00

    # Force grayscale override on a photo page
    assert calculate_page_price(ColorTier.PHOTO, PaperSize.SHORT, force_grayscale=True, config=cfg) == 3.00


def test_google_export_url_resolution():
    # Google Docs
    docs_url = "https://docs.google.com/document/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
    res = resolve_google_export_url(docs_url)
    assert res is not None
    assert "export?format=pdf" in res[0]
    assert res[1] == "Google Docs"

    # Google Slides
    slides_url = "https://docs.google.com/presentation/d/1r_4ea9c4b78/edit#slide=id.p"
    res = resolve_google_export_url(slides_url)
    assert res is not None
    assert "export/pdf" in res[0]
    assert res[1] == "Google Slides"

    # Google Sheets
    sheets_url = "https://docs.google.com/spreadsheets/d/1XYZ789/edit#gid=0"
    res = resolve_google_export_url(sheets_url)
    assert res is not None
    assert "export?format=pdf" in res[0]
    assert res[1] == "Google Sheets"


def create_sample_test_pdf() -> bytes:
    """Creates a 4-page PDF with known color profiles using ReportLab."""
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)

    # Page 1: Pure B&W Text
    c.setFont("Helvetica", 14)
    c.drawString(100, 700, "Official Monochrome Document")
    c.drawString(100, 670, "This is plain black text on white background.")
    c.drawString(100, 640, "No color elements exist on this page.")
    c.showPage()

    # Page 2: Accent Color (Small blue logo box)
    c.setFont("Helvetica", 14)
    c.drawString(100, 700, "Document with Small Accent Header")
    c.setFillColor(colors.HexColor("#0055FF"))
    c.rect(100, 620, 100, 30, fill=1, stroke=0)  # small colored banner
    c.setFillColor(colors.black)
    c.drawString(100, 580, "The rest of the document is normal text.")
    c.showPage()

    # Page 3: Medium Graphic (Several colored rectangles and graphs)
    c.setFillColor(colors.HexColor("#FF5722"))
    c.rect(50, 400, 200, 150, fill=1, stroke=0)
    c.setFillColor(colors.HexColor("#4CAF50"))
    c.rect(280, 400, 200, 150, fill=1, stroke=0)
    c.showPage()

    # Page 4: Full Heavy / Photo (Nearly entire page colored)
    c.setFillColor(colors.HexColor("#E91E63"))
    c.rect(20, 20, 572, 752, fill=1, stroke=0)
    c.showPage()

    c.save()
    return buffer.getvalue()


def test_full_pdf_analysis():
    pdf_bytes = create_sample_test_pdf()
    
    # 1. Normal automated analysis
    quote = analyze_pdf_document(pdf_bytes)
    assert quote["total_pages"] == 4
    pages = quote["pages"]

    # Page 1 should be MONO
    assert pages[0]["tier"] == "mono"
    assert pages[0]["price"] == 3.00

    # Page 2 should be ACCENT
    assert pages[1]["tier"] == "accent"
    assert pages[1]["price"] == 5.00

    # Page 3 should be MEDIUM
    assert pages[2]["tier"] == "medium"
    assert pages[2]["price"] == 8.00

    # Page 4 should be PHOTO
    assert pages[3]["tier"] == "photo"
    assert pages[3]["price"] == 15.00

    # Total: 3 + 5 + 8 + 15 = 31.00
    assert quote["total_price"] == 31.00

    # 2. Test "Make all Black & White" toggle
    mono_quote = analyze_pdf_document(pdf_bytes, force_all_grayscale=True)
    assert mono_quote["total_price"] == 12.00  # 4 pages * ₱3.00
    for p in mono_quote["pages"]:
        assert p["price"] == 3.00

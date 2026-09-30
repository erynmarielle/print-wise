"""Core computer-vision and CMYK/Chroma PDF analyzer using PyMuPDF and NumPy."""

import io
import base64
from typing import List, Dict, Any, Tuple
import fitz  # PyMuPDF
import numpy as np
from PIL import Image

from .pricing import PaperSize, ColorTier, PricingConfig, DEFAULT_PRICING, classify_page_tier, calculate_page_price


def detect_paper_size(width_pts: float, height_pts: float) -> PaperSize:
    """Detects standard Philippine paper sizes based on PDF bounding box points (72 pts/inch)."""
    # Normalize orientation to portrait
    w = min(width_pts, height_pts)
    h = max(width_pts, height_pts)

    w_in = w / 72.0
    h_in = h / 72.0

    # Letter / Short: 8.5 x 11 in
    if abs(w_in - 8.5) < 0.35 and abs(h_in - 11.0) < 0.4:
        return PaperSize.SHORT
    # A4: 8.27 x 11.69 in
    elif abs(w_in - 8.27) < 0.35 and abs(h_in - 11.69) < 0.4:
        return PaperSize.A4
    # Long / Folio: 8.5 x 13 in or Legal: 8.5 x 14 in
    elif abs(w_in - 8.5) < 0.35 and (abs(h_in - 13.0) < 0.5 or abs(h_in - 14.0) < 0.5):
        return PaperSize.LONG

    # Default to Short if close to standard portrait
    if h_in >= 12.5:
        return PaperSize.LONG
    return PaperSize.SHORT


def analyze_pixmap_color(pix: fitz.Pixmap) -> Tuple[float, float]:
    """Analyzes a PyMuPDF pixmap and returns (color_coverage_pct, mono_ink_pct).
    
    Uses SIMD-accelerated NumPy array operations:
    - Luminance Y = 0.299*R + 0.587*G + 0.114*B
    - Chroma = max(|R - G|, |R - B|, |G - B|)
    - A pixel is considered colored if chroma > 15 (avoids font anti-aliasing false positives)
      and not near pure white.
    """
    # Convert samples buffer to NumPy array (H, W, Channels)
    arr = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.h, pix.w, pix.n))
    
    # Extract RGB channels
    R = arr[:, :, 0].astype(np.float32)
    G = arr[:, :, 1].astype(np.float32)
    B = arr[:, :, 2].astype(np.float32)

    # Compute Grayscale Luminance
    Y = 0.299 * R + 0.587 * G + 0.114 * B

    # Difference between channels measures color deviation (saturation/chroma)
    diff_rg = np.abs(R - G)
    diff_rb = np.abs(R - B)
    diff_gb = np.abs(G - B)
    chroma = np.maximum(diff_rg, np.maximum(diff_rb, diff_gb))

    # A pixel is considered colored if:
    # 1. Chroma > 16.0 (distinguishable color, ignoring sub-pixel font anti-aliasing)
    # 2. Luminance < 248.0 (not plain white/off-white background)
    is_color = (chroma > 16.0) & (Y < 248.0)

    # Ink density for monochrome (darkness of black/gray pixels)
    # 0 = pure white, 1 = solid black
    ink_density = (255.0 - Y) / 255.0
    # Ignore background paper noise (< 5% black)
    ink_density = np.where(ink_density > 0.05, ink_density, 0.0)

    total_pixels = float(pix.w * pix.h)
    color_pixels = float(np.count_nonzero(is_color))
    color_coverage_pct = round((color_pixels / total_pixels) * 100.0, 2)
    mono_ink_pct = round((float(np.sum(ink_density)) / total_pixels) * 100.0, 2)

    return color_coverage_pct, mono_ink_pct


def generate_thumbnail_base64(page: fitz.Page, max_dim: int = 320) -> str:
    """Generates a compact base64 JPEG thumbnail of the page for the cashier web UI."""
    rect = page.rect
    scale = max_dim / max(rect.width, rect.height)
    mat = fitz.Matrix(scale, scale)
    thumb_pix = page.get_pixmap(matrix=mat, alpha=False)
    
    # Save as compressed JPEG
    img = Image.frombytes("RGB", [thumb_pix.w, thumb_pix.h], thumb_pix.samples)
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=65, optimize=True)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")


def analyze_pdf_document(
    pdf_bytes: bytes,
    config: PricingConfig = DEFAULT_PRICING,
    selected_paper_size: PaperSize = None,
    force_all_grayscale: bool = False,
    is_duplex: bool = False
) -> Dict[str, Any]:
    """Analyzes every page of a PDF document and produces the complete pricing quote."""
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    total_pages = len(doc)

    pages_result = []
    total_cost = 0.0
    tier_counts = {ColorTier.MONO.value: 0, ColorTier.ACCENT.value: 0, ColorTier.MEDIUM.value: 0, ColorTier.PHOTO.value: 0}

    detected_sizes = []

    for page_idx in range(total_pages):
        page = doc[page_idx]
        width, height = page.rect.width, page.rect.height
        auto_paper_size = detect_paper_size(width, height)
        detected_sizes.append(auto_paper_size)

        # Render at 150 DPI for fast and accurate analysis
        pix = page.get_pixmap(dpi=150, alpha=False)
        color_coverage, mono_ink = analyze_pixmap_color(pix)

        tier = classify_page_tier(color_coverage, config)
        tier_counts[tier.value] += 1

        effective_paper = selected_paper_size if selected_paper_size else auto_paper_size
        page_price = calculate_page_price(
            tier=tier,
            paper_size=effective_paper,
            force_grayscale=force_all_grayscale,
            config=config
        )

        total_cost += page_price
        thumbnail = generate_thumbnail_base64(page)

        pages_result.append({
            "page_number": page_idx + 1,
            "width_pts": round(width, 1),
            "height_pts": round(height, 1),
            "detected_paper_size": auto_paper_size.value,
            "effective_paper_size": effective_paper.value,
            "color_coverage_pct": color_coverage,
            "mono_ink_pct": mono_ink,
            "tier": tier.value,
            "force_grayscale": force_all_grayscale,
            "price": page_price,
            "thumbnail": thumbnail
        })

    # Apply duplex discount if configured
    if is_duplex and config.duplex_discount_percent > 0:
        discount = total_cost * (config.duplex_discount_percent / 100.0)
        total_cost = round(total_cost - discount, 2)

    # Determine primary document paper size
    primary_paper_size = selected_paper_size.value if selected_paper_size else (
        max(set(detected_sizes), key=detected_sizes.count).value if detected_sizes else PaperSize.SHORT.value
    )

    doc.close()

    return {
        "total_pages": total_pages,
        "total_price": round(total_cost, 2),
        "primary_paper_size": primary_paper_size,
        "is_duplex": is_duplex,
        "force_all_grayscale": force_all_grayscale,
        "tier_summary": tier_counts,
        "pages": pages_result
    }

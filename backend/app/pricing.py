"""Pricing rules and tier computation for print service."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class PaperSize(str, Enum):
    SHORT = "short"  # 8.5 x 11 in (Letter)
    A4 = "a4"        # 8.27 x 11.69 in
    LONG = "long"    # 8.5 x 13 in (Folio) or 8.5 x 14 in (Legal)
    UNKNOWN = "custom"


class ColorTier(str, Enum):
    MONO = "mono"            # Monochrome / Black & White
    ACCENT = "accent"        # Light color (logos, highlights, headers < 5%)
    MEDIUM = "medium"        # Medium graphic / charts (5% - 25%)
    PHOTO = "photo"          # Heavy / full page coverage / photo (> 25%)


class PricingConfig(BaseModel):
    # Base prices per page (Philippine Pesos PHP)
    price_mono: float = Field(default=3.00, description="Price for black and white page")
    price_accent: float = Field(default=5.00, description="Price for light/accent color (< 5%)")
    price_medium: float = Field(default=8.00, description="Price for medium color (5% - 25%)")
    price_photo: float = Field(default=15.00, description="Price for high coverage / photo (> 25%)")

    # Surcharges
    long_paper_surcharge: float = Field(default=1.00, description="Surcharge for long paper per page")
    duplex_discount_percent: float = Field(default=0.0, description="Discount % for back-to-back printing (e.g. 5%)")

    # Thresholds (percentage of total page area)
    accent_threshold_pct: float = Field(default=5.0, description="Max color % for accent tier")
    medium_threshold_pct: float = Field(default=25.0, description="Max color % for medium tier")


DEFAULT_PRICING = PricingConfig()


def classify_page_tier(
    color_coverage_pct: float,
    config: PricingConfig = DEFAULT_PRICING
) -> ColorTier:
    """Classifies a page into a pricing tier based on color coverage percentage."""
    if color_coverage_pct <= 0.05:  # Tolerance for tiny anti-aliasing artifacts
        return ColorTier.MONO
    elif color_coverage_pct < config.accent_threshold_pct:
        return ColorTier.ACCENT
    elif color_coverage_pct <= config.medium_threshold_pct:
        return ColorTier.MEDIUM
    else:
        return ColorTier.PHOTO


def calculate_page_price(
    tier: ColorTier,
    paper_size: PaperSize = PaperSize.SHORT,
    force_grayscale: bool = False,
    config: PricingConfig = DEFAULT_PRICING,
) -> float:
    """Calculates the price for an individual page."""
    effective_tier = ColorTier.MONO if force_grayscale else tier

    if effective_tier == ColorTier.MONO:
        base_price = config.price_mono
    elif effective_tier == ColorTier.ACCENT:
        base_price = config.price_accent
    elif effective_tier == ColorTier.MEDIUM:
        base_price = config.price_medium
    else:
        base_price = config.price_photo

    # Add Long paper surcharge if applicable
    if paper_size == PaperSize.LONG:
        base_price += config.long_paper_surcharge

    return round(base_price, 2)

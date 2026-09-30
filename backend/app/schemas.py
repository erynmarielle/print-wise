"""Pydantic schemas for API requests and responses."""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class UrlQuoteRequest(BaseModel):
    url: str = Field(..., description="Google Docs, Slides, Sheets or direct document URL")
    paper_size: Optional[str] = Field(None, description="Force paper size (short, a4, long)")
    force_all_grayscale: bool = Field(False, description="Convert quote to 100% monochrome")
    is_duplex: bool = Field(False, description="Duplex / back-to-back printing")


class PageOverride(BaseModel):
    page_number: int
    force_grayscale: bool
    custom_tier: Optional[str] = None


class RecalculateRequest(BaseModel):
    paper_size: str
    force_all_grayscale: bool = False
    is_duplex: bool = False
    pages: List[Dict[str, Any]]


class SaveJobRequest(BaseModel):
    filename: str
    file_type: str = "pdf"
    primary_paper_size: str = "short"
    is_duplex: bool = False
    total_pages: int
    total_price: float
    pages: List[Dict[str, Any]]


class PaymentRequest(BaseModel):
    job_id: str
    payment_method: str = Field(..., description="'CASH' or 'GCASH'")
    amount_paid: float
    customer_name: Optional[str] = ""
    notes: Optional[str] = ""

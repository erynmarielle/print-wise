"""FastAPI application for Print Shop Automated Pricing and Revenue Management."""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import io

from .pricing import (
    PricingConfig, DEFAULT_PRICING, PaperSize, ColorTier,
    calculate_page_price, classify_page_tier
)
from .analyzer import analyze_pdf_document, detect_paper_size
from .downloader import fetch_document_from_url
from .database import (
    init_db, save_print_job, record_transaction,
    get_revenue_summary, list_recent_jobs
)
from .schemas import (
    UrlQuoteRequest, RecalculateRequest, SaveJobRequest,
    PaymentRequest
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="Sari-Sari Store Smart Print POS & Analyzer",
    description="Automated CMYK ink coverage detection, instant quoting, and POS revenue tracker",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for local web interface
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store in-memory active pricing config (can be updated dynamically)
current_pricing = PricingConfig()


@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Print Shop Automated Quoting & Revenue Engine",
        "currency": "PHP (₱)"
    }


@app.get("/api/pricing")
def get_pricing():
    """Returns the current pricing tiers and surcharges."""
    return current_pricing.model_dump()


@app.put("/api/pricing")
def update_pricing(config: PricingConfig):
    """Updates the active pricing configuration."""
    global current_pricing
    current_pricing = config
    return {"message": "Pricing updated successfully", "pricing": current_pricing.model_dump()}


@app.post("/api/quote/upload")
async def quote_uploaded_file(
    file: UploadFile = File(...),
    paper_size: Optional[str] = Form(None),
    force_all_grayscale: bool = Form(False),
    is_duplex: bool = Form(False)
):
    """Analyzes an uploaded PDF or image file and generates page-by-page pricing."""
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    selected_paper = None
    if paper_size and paper_size != "auto":
        try:
            selected_paper = PaperSize(paper_size.lower())
        except ValueError:
            pass

    try:
        quote = analyze_pdf_document(
            pdf_bytes=content,
            config=current_pricing,
            selected_paper_size=selected_paper,
            force_all_grayscale=force_all_grayscale,
            is_duplex=is_duplex
        )
        quote["filename"] = file.filename
        return quote
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to analyze PDF: {str(exc)}")


@app.post("/api/quote/url")
async def quote_from_url(payload: UrlQuoteRequest):
    """Fetches a document from a Google Docs / Slides link and analyzes it."""
    try:
        pdf_bytes, filename = await fetch_document_from_url(payload.url)
    except ValueError as err:
        raise HTTPException(status_code=400, detail=str(err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch document: {str(exc)}")

    selected_paper = None
    if payload.paper_size and payload.paper_size != "auto":
        try:
            selected_paper = PaperSize(payload.paper_size.lower())
        except ValueError:
            pass

    try:
        quote = analyze_pdf_document(
            pdf_bytes=pdf_bytes,
            config=current_pricing,
            selected_paper_size=selected_paper,
            force_all_grayscale=payload.force_all_grayscale,
            is_duplex=payload.is_duplex
        )
        quote["filename"] = filename
        quote["source_url"] = payload.url
        return quote
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to analyze fetched PDF: {str(exc)}")


@app.post("/api/quote/recalculate")
def recalculate_quote(payload: RecalculateRequest):
    """Recalculates total price when an operator overrides paper size or grayscale options."""
    try:
        chosen_paper = PaperSize(payload.paper_size)
    except ValueError:
        chosen_paper = PaperSize.SHORT

    updated_pages = []
    total_cost = 0.0
    tier_counts = {ColorTier.MONO.value: 0, ColorTier.ACCENT.value: 0, ColorTier.MEDIUM.value: 0, ColorTier.PHOTO.value: 0}

    for page in payload.pages:
        # Check if individual page is grayscale or globally grayscale
        is_gray = payload.force_all_grayscale or page.get("force_grayscale", False)
        tier_val = page.get("tier", "mono")
        try:
            tier = ColorTier(tier_val)
        except ValueError:
            tier = ColorTier.MONO

        page_price = calculate_page_price(
            tier=tier,
            paper_size=chosen_paper,
            force_grayscale=is_gray,
            config=current_pricing
        )

        effective_tier = ColorTier.MONO.value if is_gray else tier.value
        tier_counts[effective_tier] += 1
        total_cost += page_price

        updated_page = dict(page)
        updated_page["price"] = page_price
        updated_page["effective_paper_size"] = chosen_paper.value
        updated_page["force_grayscale"] = is_gray
        updated_pages.append(updated_page)

    if payload.is_duplex and current_pricing.duplex_discount_percent > 0:
        discount = total_cost * (current_pricing.duplex_discount_percent / 100.0)
        total_cost = round(total_cost - discount, 2)

    return {
        "total_pages": len(updated_pages),
        "total_price": round(total_cost, 2),
        "primary_paper_size": chosen_paper.value,
        "is_duplex": payload.is_duplex,
        "force_all_grayscale": payload.force_all_grayscale,
        "tier_summary": tier_counts,
        "pages": updated_pages
    }


@app.post("/api/jobs")
def create_print_job(payload: SaveJobRequest):
    """Saves a confirmed print job to the ledger."""
    try:
        job_id = save_print_job(payload.model_dump(), payload.pages)
        return {"job_id": job_id, "status": "QUOTED", "message": "Print job recorded"}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database error: {str(exc)}")


@app.post("/api/transactions")
def process_payment(payload: PaymentRequest):
    """Records payment for a print job (Cash or GCash) and marks job as paid."""
    try:
        txn = record_transaction(
            job_id=payload.job_id,
            payment_method=payload.payment_method,
            amount_paid=payload.amount_paid,
            customer_name=payload.customer_name or "",
            notes=payload.notes or ""
        )
        return {"status": "SUCCESS", "transaction": txn}
    except ValueError as val_err:
        raise HTTPException(status_code=404, detail=str(val_err))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(exc)}")


@app.get("/api/revenue/summary")
def get_daily_revenue(date: Optional[str] = Query(None, description="Date in YYYY-MM-DD")):
    """Retrieves revenue, paper & ink margins, and cash vs. GCash totals for the specified date."""
    return get_revenue_summary(date)


@app.get("/api/jobs/recent")
def get_recent_jobs(limit: int = 25):
    """Retrieves recent print job orders."""
    return {"jobs": list_recent_jobs(limit)}

"""Integration tests for FastAPI endpoints: quote, transactions, and revenue tracking."""

import io
from fastapi.testclient import TestClient
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from app.main import app

client = TestClient(app)


def create_dummy_pdf() -> bytes:
    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 700, "Test Document for API")
    c.setFillColor(colors.red)
    c.rect(100, 500, 150, 100, fill=1, stroke=0)
    c.showPage()
    c.save()
    return buffer.getvalue()


def test_root_and_pricing_endpoints():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json()["status"] == "online"

    r_price = client.get("/api/pricing")
    assert r_price.status_code == 200
    assert r_price.json()["price_mono"] == 3.00


def test_full_upload_quote_and_payment_flow():
    pdf_data = create_dummy_pdf()
    
    # 1. Upload & Quote
    response = client.post(
        "/api/quote/upload",
        files={"file": ("test_doc.pdf", pdf_data, "application/pdf")},
        data={"paper_size": "short", "force_all_grayscale": "false"}
    )
    assert response.status_code == 200
    quote = response.json()
    assert quote["total_pages"] == 1
    assert quote["total_price"] > 0
    assert len(quote["pages"]) == 1
    assert quote["pages"][0]["thumbnail"].startswith("data:image/jpeg;base64,")

    # 2. Record Print Job
    job_payload = {
        "filename": quote["filename"],
        "file_type": "pdf",
        "primary_paper_size": quote["primary_paper_size"],
        "is_duplex": False,
        "total_pages": quote["total_pages"],
        "total_price": quote["total_price"],
        "pages": quote["pages"]
    }
    job_res = client.post("/api/jobs", json=job_payload)
    assert job_res.status_code == 200
    job_id = job_res.json()["job_id"]
    assert job_id is not None

    # 3. Pay via GCash
    pay_payload = {
        "job_id": job_id,
        "payment_method": "GCASH",
        "amount_paid": quote["total_price"],
        "customer_name": "Maria Santos",
        "notes": "Printed from Messenger"
    }
    pay_res = client.post("/api/transactions", json=pay_payload)
    assert pay_res.status_code == 200
    txn_data = pay_res.json()["transaction"]
    assert txn_data["payment_method"] == "GCASH"
    assert txn_data["amount_paid"] == quote["total_price"]

    # 4. Check Daily Revenue Summary
    rev_res = client.get("/api/revenue/summary")
    assert rev_res.status_code == 200
    summary = rev_res.json()
    assert summary["gcash_revenue"] >= quote["total_price"]
    assert summary["total_revenue"] >= quote["total_price"]
    assert summary["paid_jobs_count"] >= 1
    assert summary["estimated_gross_profit"] > 0

    # 5. Check Recent Jobs
    recent_res = client.get("/api/jobs/recent")
    assert recent_res.status_code == 200
    jobs = recent_res.json()["jobs"]
    assert any(j["id"] == job_id for j in jobs)

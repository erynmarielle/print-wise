# PrintWise: Sari-Sari Store Automated Print Quoter & POS Ledger

An automated print pricing engine and sales ledger designed for community and sari-sari store printing services.

---

## Key Features

1. **Automated Color & Ink Coverage Detection**:
   - Analyzes uploaded PDFs, images, or Google Docs/Slides page-by-page using **PyMuPDF** and **NumPy**.
   - Accurately classifies pages into 4 pricing tiers:
     - **Monochrome / B&W** (₱3.00)
     - **Accent Color** (< 5% coverage, e.g., logos, small headers: ₱5.00)
     - **Medium Graphic** (5% - 25% coverage, e.g., slides, graphs: ₱8.00)
     - **Full Photo / Heavy** (> 25% coverage, e.g., full-bleed photos: ₱15.00)
   - Automatically detects paper sizes (Short 8.5x11, A4, Long/Folio 8.5x13 with +₱1.00 surcharge).

2. **One-Click Grayscale Discount**:
   - When a customer asks *"Magkano pag black and white na lang lahat?"*, one click recalculates the entire document quote instantly.
   - Individual page toggle allows forcing specific pages to B&W while keeping others in color.

3. **Messenger-Friendly Google Docs & Slides Support**:
   - Simply paste any Google Docs or Google Slides link shared by customers. The system exports and analyzes it automatically.

4. **Cashier POS & Central Revenue Ledger**:
   - Collect payments via **Cash** or **GCash**.
   - Computes change to return.
   - Tracks daily gross sales, cash drawer totals, GCash receipts, paper/ink consumables estimates, and net profit.

---

## Quick Start

### 1. Launching the System
Simply double-click `start_system.bat` or run:

```bash
# In one terminal (Backend):
cd backend
.venv\Scripts\python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# In another terminal (Frontend):
cd frontend
npm run dev
```

Then visit **`http://localhost:5173`** in your browser.

---

## Testing with Sample Document

A realistic sample test document is provided at:
`backend/sample_documents/sample_print_order.pdf`

Contains 4 distinct test pages:
- Page 1: Monochrome text (₱3.00)
- Page 2: Accent blue company logo (₱5.00)
- Page 3: Presentation slide charts (₱8.00)
- Page 4: Full bleed photo (₱15.00)
- **Total auto-computed**: **₱31.00**

---

## Running Automated Tests

```bash
cd backend
.\.venv\Scripts\python -m pytest -v
```
All unit tests and API integration tests will run and validate the color detection algorithm and payment flow.

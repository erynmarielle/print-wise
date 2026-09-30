"""Generates realistic sample print documents to test the pricing engine."""

import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

os.makedirs("sample_documents", exist_ok=True)
output_path = os.path.join("sample_documents", "sample_print_order.pdf")

c = canvas.Canvas(output_path, pagesize=letter)

# Page 1: Monochrome text (Tier 1: B&W - ₱3.00)
c.setFont("Helvetica-Bold", 16)
c.drawString(72, 720, "Page 1: Official Research Paper / Monochrome")
c.setFont("Helvetica", 11)
c.drawString(72, 690, "This page contains standard black and white academic text.")
c.drawString(72, 670, "Antigravity print analyzer classifies this as Tier 1 (Monochrome).")
c.drawString(72, 650, "Expected pricing: ₱3.00 (PHP).")
c.showPage()

# Page 2: Accent color (Tier 2: Accent - ₱5.00)
c.setFont("Helvetica-Bold", 16)
c.drawString(72, 720, "Page 2: Company Letterhead with Accent Logo")
# Blue logo bar
c.setFillColor(colors.HexColor("#0284c7"))
c.roundRect(72, 650, 180, 40, 4, fill=1, stroke=0)
c.setFillColor(colors.white)
c.setFont("Helvetica-Bold", 12)
c.drawString(85, 665, "ACCENT COLOR LOGO")
c.setFillColor(colors.black)
c.setFont("Helvetica", 11)
c.drawString(72, 610, "Color coverage is under 5% of total page area.")
c.drawString(72, 590, "Expected pricing: ₱5.00 (PHP).")
c.showPage()

# Page 3: Presentation slide / Medium graphic (Tier 3: Medium - ₱8.00)
c.setFont("Helvetica-Bold", 16)
c.drawString(72, 720, "Page 3: Presentation Infographic / Charts")
# Chart 1
c.setFillColor(colors.HexColor("#f97316"))
c.rect(72, 450, 200, 180, fill=1, stroke=0)
# Chart 2
c.setFillColor(colors.HexColor("#10b981"))
c.rect(300, 450, 200, 180, fill=1, stroke=0)
c.setFillColor(colors.black)
c.setFont("Helvetica", 11)
c.drawString(72, 400, "Color coverage is between 5% and 25% of the page.")
c.drawString(72, 380, "Expected pricing: ₱8.00 (PHP).")
c.showPage()

# Page 4: Full bleed photo / heavy graphic (Tier 4: Photo - ₱15.00)
c.setFillColor(colors.HexColor("#ec4899"))
c.rect(36, 36, 540, 720, fill=1, stroke=0)
c.setFillColor(colors.white)
c.setFont("Helvetica-Bold", 22)
c.drawCentredString(306, 400, "FULL BLEED COLOR PHOTO")
c.setFont("Helvetica", 13)
c.drawCentredString(306, 370, "Heavy toner coverage > 25% (Expected: ₱15.00)")
c.showPage()

c.save()
print(f"Generated realistic sample document: {output_path}")

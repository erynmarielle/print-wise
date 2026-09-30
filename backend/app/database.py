"""SQLite database models and revenue tracking ledger using sqlite3."""

import sqlite3
import json
import uuid
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from pathlib import Path

DB_FILE = Path(__file__).parent.parent / "print_shop.db"


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with WAL mode enabled for concurrent reading/writing."""
    conn = sqlite3.connect(str(DB_FILE))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_db():
    """Initializes tables for print jobs, job pages, and payment transactions."""
    with get_db_connection() as conn:

        conn.executescript("""
        CREATE TABLE IF NOT EXISTS print_jobs (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            file_type TEXT NOT NULL,
            paper_size TEXT NOT NULL,
            is_duplex INTEGER DEFAULT 0,
            total_pages INTEGER NOT NULL,
            total_price REAL NOT NULL,
            status TEXT DEFAULT 'QUOTED', -- 'QUOTED', 'PRINTED', 'PAID', 'CANCELLED'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS job_pages (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            page_number INTEGER NOT NULL,
            color_coverage_pct REAL NOT NULL,
            mono_ink_pct REAL NOT NULL,
            tier TEXT NOT NULL,
            price REAL NOT NULL,
            force_grayscale INTEGER DEFAULT 0,
            FOREIGN KEY (job_id) REFERENCES print_jobs(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            job_id TEXT NOT NULL,
            customer_name TEXT DEFAULT '',
            payment_method TEXT NOT NULL, -- 'CASH', 'GCASH'
            amount_paid REAL NOT NULL,
            change_given REAL DEFAULT 0.0,
            notes TEXT DEFAULT '',
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (job_id) REFERENCES print_jobs(id)
        );
        """)
        conn.commit()


def save_print_job(job_data: Dict[str, Any], pages: List[Dict[str, Any]]) -> str:
    """Saves a computed print job and its page breakdown into the database."""
    job_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    with get_db_connection() as conn:
        conn.execute("""
            INSERT INTO print_jobs (id, filename, file_type, paper_size, is_duplex, total_pages, total_price, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id,
            job_data.get("filename", "untitled.pdf"),
            job_data.get("file_type", "pdf"),
            job_data.get("primary_paper_size", "short"),
            1 if job_data.get("is_duplex") else 0,
            job_data.get("total_pages", len(pages)),
            job_data.get("total_price", 0.0),
            job_data.get("status", "QUOTED"),
            now
        ))

        for page in pages:
            page_id = str(uuid.uuid4())
            conn.execute("""
                INSERT INTO job_pages (id, job_id, page_number, color_coverage_pct, mono_ink_pct, tier, price, force_grayscale)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                page_id,
                job_id,
                page["page_number"],
                page["color_coverage_pct"],
                page["mono_ink_pct"],
                page["tier"],
                page["price"],
                1 if page.get("force_grayscale") else 0
            ))
        conn.commit()
    return job_id


def record_transaction(
    job_id: str,
    payment_method: str,
    amount_paid: float,
    customer_name: str = "",
    notes: str = ""
) -> Dict[str, Any]:
    """Records a payment (Cash / GCash) and updates the job status to PAID."""
    txn_id = str(uuid.uuid4())
    now = datetime.now().isoformat()

    with get_db_connection() as conn:
        job = conn.execute("SELECT total_price FROM print_jobs WHERE id = ?", (job_id,)).fetchone()
        if not job:
            raise ValueError(f"Job with ID {job_id} not found.")

        total_price = float(job["total_price"])
        change = max(0.0, round(amount_paid - total_price, 2))

        conn.execute("""
            INSERT INTO transactions (id, job_id, customer_name, payment_method, amount_paid, change_given, notes, completed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (txn_id, job_id, customer_name, payment_method.upper(), amount_paid, change, notes, now))

        conn.execute("UPDATE print_jobs SET status = 'PAID' WHERE id = ?", (job_id,))
        conn.commit()

        return {
            "transaction_id": txn_id,
            "job_id": job_id,
            "total_price": total_price,
            "payment_method": payment_method.upper(),
            "amount_paid": amount_paid,
            "change_given": change,
            "completed_at": now
        }


def get_revenue_summary(target_date: Optional[str] = None) -> Dict[str, Any]:
    """Computes daily revenue breakdown (Total, Cash, GCash, pages, jobs) for a given date (default today)."""
    if not target_date:
        target_date = date.today().isoformat()

    with get_db_connection() as conn:
        # Sum payments by method
        rows = conn.execute("""
            SELECT 
                t.payment_method,
                COUNT(t.id) as txn_count,
                SUM(j.total_price) as method_total
            FROM transactions t
            JOIN print_jobs j ON t.job_id = j.id
            WHERE date(t.completed_at) = date(?)
            GROUP BY t.payment_method
        """, (target_date,)).fetchall()

        cash_total = 0.0
        gcash_total = 0.0
        total_txns = 0

        for r in rows:
            method = r["payment_method"]
            amount = float(r["method_total"] or 0.0)
            total_txns += r["txn_count"]
            if method == "CASH":
                cash_total += amount
            elif method == "GCASH":
                gcash_total += amount

        # Total pages printed today
        page_stat = conn.execute("""
            SELECT SUM(j.total_pages) as total_pages, COUNT(j.id) as job_count
            FROM print_jobs j
            JOIN transactions t ON t.job_id = j.id
            WHERE date(t.completed_at) = date(?)
        """, (target_date,)).fetchone()

        total_pages = int(page_stat["total_pages"] or 0)
        paid_jobs = int(page_stat["job_count"] or 0)

        # Estimate consumables cost (approx ₱0.60 per sheet paper + ₱0.40 ink average)
        estimated_paper_cost = round(total_pages * 0.60, 2)
        estimated_ink_cost = round(total_pages * 0.50, 2)
        total_revenue = round(cash_total + gcash_total, 2)
        estimated_gross_profit = round(total_revenue - (estimated_paper_cost + estimated_ink_cost), 2)

        return {
            "date": target_date,
            "total_revenue": total_revenue,
            "cash_revenue": round(cash_total, 2),
            "gcash_revenue": round(gcash_total, 2),
            "paid_jobs_count": paid_jobs,
            "total_pages_printed": total_pages,
            "estimated_paper_cost": estimated_paper_cost,
            "estimated_ink_cost": estimated_ink_cost,
            "estimated_gross_profit": estimated_gross_profit
        }


def list_recent_jobs(limit: int = 25) -> List[Dict[str, Any]]:
    """Returns the most recent print jobs with their status and transaction info."""
    with get_db_connection() as conn:
        rows = conn.execute("""
            SELECT 
                j.id, j.filename, j.paper_size, j.is_duplex, j.total_pages, j.total_price, j.status, j.created_at,
                t.payment_method, t.completed_at, t.customer_name
            FROM print_jobs j
            LEFT JOIN transactions t ON t.job_id = j.id
            ORDER BY j.created_at DESC
            LIMIT ?
        """, (limit,)).fetchall()

        return [dict(r) for r in rows]


# Ensure tables exist upon import
init_db()

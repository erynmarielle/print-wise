import type { QuoteResponse, RevenueSummary, RecentJob, PricingConfig } from './types';

const API_BASE = 'http://localhost:8000';

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function uploadAndQuote(
  file: File,
  paperSize?: string,
  forceGrayscale: boolean = false,
  isDuplex: boolean = false
): Promise<QuoteResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (paperSize && paperSize !== 'auto') {
    formData.append('paper_size', paperSize);
  }
  formData.append('force_all_grayscale', String(forceGrayscale));
  formData.append('is_duplex', String(isDuplex));

  const res = await fetch(`${API_BASE}/api/quote/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Failed to analyze uploaded file.');
  }

  return res.json();
}

export async function quoteFromUrl(
  url: string,
  paperSize?: string,
  forceGrayscale: boolean = false,
  isDuplex: boolean = false
): Promise<QuoteResponse> {
  const res = await fetch(`${API_BASE}/api/quote/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      paper_size: paperSize !== 'auto' ? paperSize : null,
      force_all_grayscale: forceGrayscale,
      is_duplex: isDuplex,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'URL fetch failed' }));
    throw new Error(err.detail || 'Failed to process document URL.');
  }

  return res.json();
}

export async function recalculateQuote(
  paperSize: string,
  forceGrayscale: boolean,
  isDuplex: boolean,
  pages: any[]
): Promise<QuoteResponse> {
  const res = await fetch(`${API_BASE}/api/quote/recalculate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paper_size: paperSize,
      force_all_grayscale: forceGrayscale,
      is_duplex: isDuplex,
      pages,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to recalculate quote');
  }

  return res.json();
}

export async function recordPrintJob(job: {
  filename: string;
  file_type: string;
  primary_paper_size: string;
  is_duplex: boolean;
  total_pages: number;
  total_price: number;
  pages: any[];
}): Promise<string> {
  const res = await fetch(`${API_BASE}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job),
  });

  if (!res.ok) {
    throw new Error('Failed to record job in database');
  }

  const data = await res.json();
  return data.job_id;
}

export async function recordPayment(payment: {
  job_id: string;
  payment_method: 'CASH' | 'GCASH';
  amount_paid: number;
  customer_name?: string;
  notes?: string;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payment),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Payment failed' }));
    throw new Error(err.detail || 'Failed to record transaction');
  }

  return res.json();
}

export async function getRevenueSummary(date?: string): Promise<RevenueSummary> {
  const q = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/api/revenue/summary${q}`);
  if (!res.ok) throw new Error('Failed to load revenue summary');
  return res.json();
}

export async function getRecentJobs(limit: number = 25): Promise<RecentJob[]> {
  const res = await fetch(`${API_BASE}/api/jobs/recent?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to load recent jobs');
  const data = await res.json();
  return data.jobs || [];
}

export async function getPricing(): Promise<PricingConfig> {
  const res = await fetch(`${API_BASE}/api/pricing`);
  if (!res.ok) throw new Error('Failed to load pricing');
  return res.json();
}

export async function updatePricing(config: PricingConfig): Promise<void> {
  const res = await fetch(`${API_BASE}/api/pricing`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Failed to update pricing');
}

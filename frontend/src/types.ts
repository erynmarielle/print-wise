export interface PageQuote {
  page_number: number;
  width_pts: number;
  height_pts: number;
  detected_paper_size: string;
  effective_paper_size: string;
  color_coverage_pct: number;
  mono_ink_pct: number;
  tier: "mono" | "accent" | "medium" | "photo";
  force_grayscale: boolean;
  price: number;
  thumbnail: string;
}

export interface QuoteResponse {
  filename: string;
  total_pages: number;
  total_price: number;
  primary_paper_size: string;
  is_duplex: boolean;
  force_all_grayscale: boolean;
  tier_summary: {
    mono: number;
    accent: number;
    medium: number;
    photo: number;
  };
  pages: PageQuote[];
  source_url?: string;
}

export interface RevenueSummary {
  date: string;
  total_revenue: number;
  cash_revenue: number;
  gcash_revenue: number;
  paid_jobs_count: number;
  total_pages_printed: number;
  estimated_paper_cost: number;
  estimated_ink_cost: number;
  estimated_gross_profit: number;
}

export interface RecentJob {
  id: string;
  filename: string;
  paper_size: string;
  is_duplex: number;
  total_pages: number;
  total_price: number;
  status: string;
  created_at: string;
  payment_method?: string;
  completed_at?: string;
  customer_name?: string;
}

export interface PricingConfig {
  price_mono: number;
  price_accent: number;
  price_medium: number;
  price_photo: number;
  long_paper_surcharge: number;
  duplex_discount_percent: number;
  accent_threshold_pct: number;
  medium_threshold_pct: number;
}

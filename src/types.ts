export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  SUBMISSIONS_QUEUE: Queue<QueueMessage>;
  ENVIRONMENT: string;
  IP_HASH_SALT?: string;
}

export interface QueueMessage {
  type: "report";
  reportId: string;
  ipHash: string;
  procedureType: string;
  procedureOther: string | null;
  city: string;
  state: string;
  hospitalTier: string;
  insuranceUsed: string;
  quotedAmount: number;
  finalAmount: number;
  surprisePercentage: number;
  stayDays: number | null;
  procedureYear: number;
  flagged: boolean;
  flagReasons: string[];
  surpriseCharges: SurpriseChargeInput[];
}

export interface ReportInput {
  procedure_type: string;
  procedure_other?: string;
  city: string;
  hospital_tier: string;
  insurance_used: string;
  quoted_amount: number;
  final_amount: number;
  stay_days?: number;
  procedure_year: number;
  surprise_charges?: SurpriseChargeInput[];
  honeypot?: string;
  form_loaded_at?: number;
  turnstile_token?: string;
}

export interface SurpriseChargeInput {
  description: string;
  amount: number;
}

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface AggregateRow {
  city: string;
  procedure_type: string;
  hospital_tier: string;
  report_count: number;
  avg_quoted: number;
  avg_final: number;
  avg_surprise_pct: number;
  max_surprise_pct: number;
  min_surprise_pct: number;
  updated_at: string;
}

export interface ReportRow {
  id: string;
  ip_hash: string;
  procedure_type: string;
  procedure_other: string | null;
  city: string;
  state: string;
  hospital_tier: string;
  insurance_used: string;
  quoted_amount: number;
  final_amount: number;
  surprise_percentage: number;
  stay_days: number | null;
  procedure_year: number;
  flagged: number;
  quarantined: number;
  created_at: string;
}

export interface SurpriseItemRow {
  id: string;
  report_id: string;
  description: string;
  amount: number;
  upvotes: number;
  created_at: string;
}

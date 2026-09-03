const API_BASE = "https://gotbilled.gotbilled.workers.dev";

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "Unknown error");
  return json.data;
}

async function postApi<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({ ok: false, error: `HTTP ${res.status}` }));
  if (!json.ok) throw new Error(json.error || "Unknown error");
  return json.data;
}

export interface StatsData {
  total_reports: number;
  national_avg_surprise: number;
  total_overbilled: number;
  today_count: number;
  city_leaderboard: Array<{
    city: string;
    reports: number;
    avg_surprise: number;
  }>;
  top_absurd_charge: {
    description: string;
    amount: number;
    upvotes: number;
    city: string;
    hospital_tier: string;
  } | null;
}

export interface CityOption {
  slug: string;
  name: string;
  state: string;
}

export interface ProcedureOption {
  slug: string;
  name: string;
  category: string;
  categoryName: string;
}

export interface SubmitResult {
  id: string;
  surprise_percentage: number;
  flagged: boolean;
}

export function getStats() {
  return fetchApi<StatsData>("/api/stats");
}

export function getCities() {
  return fetchApi<CityOption[]>("/api/cities");
}

export function getProcedures() {
  return fetchApi<ProcedureOption[]>("/api/procedures");
}

export function submitReport(data: Record<string, unknown>) {
  return postApi<SubmitResult>("/api/report", data);
}

export function upvoteItem(itemId: string) {
  return postApi<void>(`/api/upvote/${itemId}`, {});
}

export interface AggregateRow {
  procedure_type: string;
  hospital_tier: string;
  city: string;
  report_count: number;
  avg_quoted: number;
  avg_final: number;
  avg_surprise_pct: number;
  max_surprise_pct: number;
  min_surprise_pct: number;
}

export interface CityData {
  city: string;
  state: string;
  aggregates: AggregateRow[];
  top_surprise_items: AbsurdItem[];
  overview: {
    total: number;
    avg_surprise: number;
    avg_quoted: number;
    avg_final: number;
  } | null;
}

export interface ProcedureData {
  procedure: string;
  display_name: string;
  aggregates: AggregateRow[];
  overview: {
    total: number;
    avg_surprise: number;
    avg_quoted: number;
    avg_final: number;
  } | null;
}

export interface CategoryData {
  category: string;
  display_name: string;
  aggregates: AggregateRow[];
  overview: {
    total: number;
    avg_surprise: number;
    avg_quoted: number;
    avg_final: number;
  } | null;
}

export interface AbsurdItem {
  id?: string;
  description: string;
  amount: number;
  upvotes: number;
  city: string;
  hospital_tier: string;
  procedure_type: string;
  created_at?: string;
}

export interface AbsurdFeedData {
  items: AbsurdItem[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface FeedReport {
  id: string;
  procedure_type: string;
  city: string;
  state: string;
  hospital_tier: string;
  insurance_used: string;
  quoted_amount: number;
  final_amount: number;
  surprise_percentage: number;
  procedure_year: number;
  created_at: string;
}

export interface FeedData {
  reports: FeedReport[];
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
}

export interface CalculatorData {
  available: boolean;
  message?: string;
  report_count?: number;
  avg_quoted?: number;
  avg_final?: number;
  avg_surprise_pct?: number;
  max_surprise_pct?: number;
  min_surprise_pct?: number;
}

export function getCityData(city: string) {
  return fetchApi<CityData>(`/api/city/${city}`);
}

export function getProcedureData(procedure: string) {
  return fetchApi<ProcedureData>(`/api/procedure/${procedure}`);
}

export function getCategoryData(category: string) {
  return fetchApi<CategoryData>(`/api/category/${category}`);
}

export function getAbsurdFeed(page = 1, limit = 20) {
  return fetchApi<AbsurdFeedData>(`/api/absurd?page=${page}&limit=${limit}`);
}

export function getCalculator(procedure: string, city: string, tier?: string) {
  let url = `/api/calculator?procedure=${procedure}&city=${city}`;
  if (tier) url += `&tier=${tier}`;
  return fetchApi<CalculatorData>(url);
}

export function getFeed(page = 1, limit = 20) {
  return fetchApi<FeedData>(`/api/feed?page=${page}&limit=${limit}`);
}

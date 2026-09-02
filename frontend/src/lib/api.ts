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
  const json = await res.json();
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

export function getCityData(city: string) {
  return fetchApi<unknown>(`/api/city/${city}`);
}

export function getProcedureData(procedure: string) {
  return fetchApi<unknown>(`/api/procedure/${procedure}`);
}

export function getAbsurdFeed(page = 1, limit = 20) {
  return fetchApi<unknown>(`/api/absurd?page=${page}&limit=${limit}`);
}

export function getCalculator(procedure: string, city: string, tier?: string) {
  let url = `/api/calculator?procedure=${procedure}&city=${city}`;
  if (tier) url += `&tier=${tier}`;
  return fetchApi<unknown>(url);
}

export function getFeed(page = 1, limit = 20) {
  return fetchApi<unknown>(`/api/feed?page=${page}&limit=${limit}`);
}

import { getCities, getProcedures, getStats, getInsights } from "$lib/api";
import type { CityOption, ProcedureOption, StatsData, InsightsData } from "$lib/api";

export async function load({ url }: { url: URL }): Promise<{
  cities: CityOption[];
  procedures: ProcedureOption[];
  stats: StatsData | null;
  insights: InsightsData | null;
  initialCity: string;
  initialCategory: string;
  initialProcedure: string;
}> {
  const initialCity = url.searchParams.get("city") || "";
  const initialCategory = url.searchParams.get("category") || "";
  const initialProcedure = url.searchParams.get("procedure") || "";

  try {
    const [cities, procedures, stats, insights] = await Promise.all([
      getCities(),
      getProcedures(),
      getStats(),
      getInsights().catch(() => null),
    ]);
    return { cities, procedures, stats, insights, initialCity, initialCategory, initialProcedure };
  } catch {
    return { cities: [], procedures: [], stats: null, insights: null, initialCity, initialCategory, initialProcedure };
  }
}

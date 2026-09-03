import { getCities, getProcedures, getStats } from "$lib/api";
import type { CityOption, ProcedureOption, StatsData } from "$lib/api";

export async function load({ url }: { url: URL }): Promise<{
  cities: CityOption[];
  procedures: ProcedureOption[];
  stats: StatsData | null;
  initialCity: string;
  initialCategory: string;
  initialProcedure: string;
}> {
  const initialCity = url.searchParams.get("city") || "";
  const initialCategory = url.searchParams.get("category") || "";
  const initialProcedure = url.searchParams.get("procedure") || "";

  try {
    const [cities, procedures, stats] = await Promise.all([
      getCities(),
      getProcedures(),
      getStats(),
    ]);
    return { cities, procedures, stats, initialCity, initialCategory, initialProcedure };
  } catch {
    return { cities: [], procedures: [], stats: null, initialCity, initialCategory, initialProcedure };
  }
}

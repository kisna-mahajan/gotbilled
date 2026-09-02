import { getCities, getProcedures, getStats } from "$lib/api";
import type { CityOption, ProcedureOption, StatsData } from "$lib/api";

export async function load(): Promise<{
  cities: CityOption[];
  procedures: ProcedureOption[];
  stats: StatsData | null;
}> {
  try {
    const [cities, procedures, stats] = await Promise.all([
      getCities(),
      getProcedures(),
      getStats(),
    ]);
    return { cities, procedures, stats };
  } catch {
    return { cities: [], procedures: [], stats: null };
  }
}

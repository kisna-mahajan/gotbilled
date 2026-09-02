import { getCities, getProcedures } from "$lib/api";
import type { CityOption, ProcedureOption } from "$lib/api";

export async function load(): Promise<{
  cities: CityOption[];
  procedures: ProcedureOption[];
}> {
  try {
    const [cities, procedures] = await Promise.all([getCities(), getProcedures()]);
    return { cities, procedures };
  } catch {
    return { cities: [], procedures: [] };
  }
}

import { getStats } from "$lib/api";
import type { StatsData } from "$lib/api";

export async function load({ fetch: _fetch }): Promise<{ stats: StatsData | null }> {
  try {
    const stats = await getStats();
    return { stats };
  } catch {
    return { stats: null };
  }
}

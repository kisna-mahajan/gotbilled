import { Env, ApiResponse } from "./types";
import {
  PROCEDURE_TYPES,
  PROCEDURE_CATEGORIES,
  CITY_STATE_MAP,
  MIN_AGGREGATION_THRESHOLD,
} from "./data";

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CACHE_TTL = {
  stats: 3600,
  city: 3600,
  procedure: 3600,
  absurd: 900,
  feed: 300,
  calculator: 3600,
  overview: 3600,
};

const PROC_TO_CAT: Record<string, string> = {};
for (const [catSlug, cat] of Object.entries(PROCEDURE_CATEGORIES)) {
  for (const procSlug of Object.keys(cat.procedures)) {
    PROC_TO_CAT[procSlug] = catSlug;
  }
}

async function cachedResponse(
  env: Env,
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<unknown>
): Promise<Response> {
  const kvKey = `cache:${cacheKey}`;
  const cached = await env.CACHE.get(kvKey);
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
    });
  }

  // Cache stampede lock: prevent multiple workers from fetching simultaneously
  const lockKey = `lock:${cacheKey}`;
  const locked = await env.CACHE.get(lockKey);
  if (locked) {
    // Another worker is refreshing — proceed anyway but skip lock acquisition
    // The lock just reduces redundant D1 queries under load
  } else {
    // Set a short lock to prevent other workers from also fetching
    await env.CACHE.put(lockKey, "1", { expirationTtl: 60 });
  }

  const data = await fetcher();
  const body: ApiResponse = { ok: true, data };
  const json = JSON.stringify(body);

  await env.CACHE.put(kvKey, json, { expirationTtl: ttl });

  return new Response(json, {
    headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
  });
}

export async function handleStats(env: Env): Promise<Response> {
  return cachedResponse(env, "stats", CACHE_TTL.stats, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT COUNT(*) as total_reports,
                COALESCE(AVG(surprise_percentage), 0) as national_avg_surprise,
                COALESCE(SUM(final_amount - quoted_amount), 0) as total_overbilled
         FROM reports WHERE quarantined = 0`
      ),
      env.DB.prepare(
        `SELECT city, SUM(report_count) as reports,
                SUM(avg_surprise_pct * report_count) / SUM(report_count) as avg_surprise
         FROM aggregates
         GROUP BY city
         HAVING SUM(report_count) >= 1
         ORDER BY avg_surprise DESC
         LIMIT 10`
      ),
      env.DB.prepare(
        `SELECT si.description, si.amount, si.upvotes, r.city, r.hospital_tier
         FROM surprise_items si
         JOIN reports r ON si.report_id = r.id
         WHERE r.quarantined = 0
         ORDER BY si.upvotes DESC
         LIMIT 1`
      ),
      env.DB.prepare(
        `SELECT COUNT(*) as today_count
         FROM reports
         WHERE created_at > datetime('now', '-1 day') AND quarantined = 0`
      ),
      env.DB.prepare(
        `SELECT procedure_type,
                SUM(report_count) as reports,
                SUM(avg_surprise_pct * report_count) / SUM(report_count) as avg_surprise
         FROM aggregates
         GROUP BY procedure_type
         HAVING SUM(report_count) >= 1`
      ),
    ]);

    const overview = results[0].results[0] as Record<string, unknown> | undefined;
    const cityLeaderboard = results[1].results;
    const topAbsurd = results[2].results[0] || null;
    const todayCount = results[3].results[0] as Record<string, unknown> | undefined;
    const procedureRows = results[4].results as Array<{ procedure_type: string; reports: number; avg_surprise: number }>;

    const catAgg: Record<string, { reports: number; weightedSurprise: number }> = {};
    for (const row of procedureRows) {
      const cat = PROC_TO_CAT[row.procedure_type] || "other";
      if (!catAgg[cat]) catAgg[cat] = { reports: 0, weightedSurprise: 0 };
      catAgg[cat].reports += row.reports;
      catAgg[cat].weightedSurprise += row.avg_surprise * row.reports;
    }

    const topCategories = Object.entries(catAgg)
      .filter(([slug]) => slug !== "other" && slug in PROCEDURE_CATEGORIES)
      .map(([slug, agg]) => ({
        category: slug,
        category_name: PROCEDURE_CATEGORIES[slug].name,
        reports: agg.reports,
        avg_surprise: Math.round((agg.weightedSurprise / agg.reports) * 100) / 100,
      }))
      .sort((a, b) => b.avg_surprise - a.avg_surprise)
      .slice(0, 5);

    return {
      total_reports: overview?.total_reports ?? 0,
      national_avg_surprise: Math.round((overview?.national_avg_surprise as number ?? 0) * 100) / 100,
      total_overbilled: overview?.total_overbilled ?? 0,
      today_count: todayCount?.today_count ?? 0,
      city_leaderboard: cityLeaderboard,
      top_categories: topCategories,
      top_absurd_charge: topAbsurd,
    };
  });
}

export async function handleCityPage(
  city: string,
  env: Env
): Promise<Response> {
  if (!(city in CITY_STATE_MAP)) {
    return jsonResponse({ ok: false, error: "City not found" }, 404);
  }

  return cachedResponse(env, `city:${city}`, CACHE_TTL.city, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT procedure_type, hospital_tier, report_count,
                avg_quoted, avg_final, avg_surprise_pct,
                max_surprise_pct, min_surprise_pct
         FROM aggregates
         WHERE city = ?
         ORDER BY report_count DESC`
      ).bind(city),
      env.DB.prepare(
        `SELECT si.description, si.amount, si.upvotes, r.procedure_type, r.hospital_tier
         FROM surprise_items si
         JOIN reports r ON si.report_id = r.id
         WHERE r.city = ? AND r.quarantined = 0
         ORDER BY si.upvotes DESC
         LIMIT 10`
      ).bind(city),
      env.DB.prepare(
        `SELECT COUNT(*) as total,
                AVG(surprise_percentage) as avg_surprise,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final
         FROM reports
         WHERE city = ? AND quarantined = 0`
      ).bind(city),
    ]);

    return {
      city,
      state: CITY_STATE_MAP[city],
      aggregates: results[0].results,
      top_surprise_items: results[1].results,
      overview: results[2].results[0] || null,
    };
  });
}

export async function handleProcedurePage(
  procedure: string,
  env: Env
): Promise<Response> {
  if (!(procedure in PROCEDURE_TYPES)) {
    return jsonResponse({ ok: false, error: "Procedure not found" }, 404);
  }

  return cachedResponse(env, `procedure:${procedure}`, CACHE_TTL.procedure, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT city, hospital_tier, report_count,
                avg_quoted, avg_final, avg_surprise_pct,
                max_surprise_pct, min_surprise_pct
         FROM aggregates
         WHERE procedure_type = ?
         ORDER BY avg_surprise_pct DESC`
      ).bind(procedure),
      env.DB.prepare(
        `SELECT COUNT(*) as total,
                AVG(surprise_percentage) as avg_surprise,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final
         FROM reports
         WHERE procedure_type = ? AND quarantined = 0`
      ).bind(procedure),
    ]);

    return {
      procedure,
      display_name: PROCEDURE_TYPES[procedure],
      aggregates: results[0].results,
      overview: results[1].results[0] || null,
    };
  });
}

export async function handleCategoryPage(
  category: string,
  env: Env
): Promise<Response> {
  if (!(category in PROCEDURE_CATEGORIES)) {
    return jsonResponse({ ok: false, error: "Category not found" }, 404);
  }

  const procedureSlugs = Object.keys(PROCEDURE_CATEGORIES[category].procedures);
  const placeholders = procedureSlugs.map(() => "?").join(",");

  return cachedResponse(env, `category:${category}`, CACHE_TTL.procedure, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT city, hospital_tier,
                SUM(report_count) as report_count,
                SUM(avg_quoted * report_count) / SUM(report_count) as avg_quoted,
                SUM(avg_final * report_count) / SUM(report_count) as avg_final,
                SUM(avg_surprise_pct * report_count) / SUM(report_count) as avg_surprise_pct,
                MAX(max_surprise_pct) as max_surprise_pct,
                MIN(min_surprise_pct) as min_surprise_pct
         FROM aggregates
         WHERE procedure_type IN (${placeholders})
         GROUP BY city, hospital_tier
         HAVING SUM(report_count) >= 1
         ORDER BY SUM(report_count) DESC`
      ).bind(...procedureSlugs),
      env.DB.prepare(
        `SELECT COUNT(*) as total,
                AVG(surprise_percentage) as avg_surprise,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final
         FROM reports
         WHERE procedure_type IN (${placeholders}) AND quarantined = 0`
      ).bind(...procedureSlugs),
    ]);

    return {
      category,
      display_name: PROCEDURE_CATEGORIES[category].name,
      aggregates: results[0].results,
      overview: results[1].results[0] || null,
    };
  });
}

export async function handleAbsurdFeed(
  url: URL,
  env: Env
): Promise<Response> {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));
  const offset = (page - 1) * limit;

  const city = url.searchParams.get("city") || "";
  const procedure = url.searchParams.get("procedure") || "";
  const tier = url.searchParams.get("tier") || "";
  const category = url.searchParams.get("category") || "";

  const conditions: string[] = ["r.quarantined = 0"];
  const bindings: (string | number)[] = [];

  if (city) { conditions.push("r.city = ?"); bindings.push(city); }
  if (tier) { conditions.push("r.hospital_tier = ?"); bindings.push(tier); }
  if (procedure) {
    conditions.push("r.procedure_type = ?");
    bindings.push(procedure);
  } else if (category && category in PROCEDURE_CATEGORIES) {
    const slugs = Object.keys(PROCEDURE_CATEGORIES[category].procedures);
    if (slugs.length > 0) {
      conditions.push(`r.procedure_type IN (${slugs.map(() => "?").join(",")})`);
      bindings.push(...slugs);
    }
  }

  const whereClause = conditions.join(" AND ");
  const filterParts = [city, procedure || category, tier].filter(Boolean);
  const baseKey = filterParts.length > 0 ? `absurd:f:${filterParts.join(":")}` : "absurd";
  const cacheKey = page === 1 && limit === 20 ? baseKey : `${baseKey}:${page}:${limit}`;

  return cachedResponse(env, cacheKey, CACHE_TTL.absurd, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT si.id, si.description, si.amount, si.upvotes, si.created_at,
                r.city, r.hospital_tier, r.procedure_type
         FROM surprise_items si
         JOIN reports r ON si.report_id = r.id
         WHERE ${whereClause}
         ORDER BY si.upvotes DESC, si.amount DESC
         LIMIT ? OFFSET ?`
      ).bind(...bindings, limit, offset),
      env.DB.prepare(
        `SELECT COUNT(*) as total
         FROM surprise_items si
         JOIN reports r ON si.report_id = r.id
         WHERE ${whereClause}`
      ).bind(...bindings),
    ]);

    const total = (results[1].results[0] as Record<string, unknown>)?.total as number ?? 0;

    return {
      items: results[0].results,
      page,
      limit,
      total,
      has_more: offset + limit < total,
    };
  });
}

export async function handleCalculator(
  url: URL,
  env: Env
): Promise<Response> {
  const procedure = url.searchParams.get("procedure");
  const city = url.searchParams.get("city");

  if (!procedure || !city) {
    return jsonResponse(
      { ok: false, error: "procedure and city are required" },
      400
    );
  }

  const cacheKey = `calc4:${procedure}:${city}`;

  return cachedResponse(env, cacheKey, CACHE_TTL.calculator, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT COUNT(*) as bills_shared,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final,
                AVG(surprise_percentage) as avg_surprise,
                MAX(surprise_percentage) as max_surprise,
                MIN(surprise_percentage) as min_surprise
         FROM reports
         WHERE procedure_type = ? AND city = ? AND quarantined = 0`
      ).bind(procedure, city),
      env.DB.prepare(
        `SELECT hospital_tier, insurance_used,
                COUNT(*) as bills_shared,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final,
                AVG(surprise_percentage) as avg_surprise
         FROM reports
         WHERE procedure_type = ? AND city = ? AND quarantined = 0
         GROUP BY hospital_tier, insurance_used
         ORDER BY hospital_tier, insurance_used`
      ).bind(procedure, city),
      env.DB.prepare(
        `SELECT si.id, si.description, si.amount, si.upvotes, r.hospital_tier
         FROM surprise_items si
         JOIN reports r ON si.report_id = r.id
         WHERE r.procedure_type = ? AND r.city = ? AND r.quarantined = 0
         ORDER BY si.upvotes DESC, si.amount DESC
         LIMIT 10`
      ).bind(procedure, city),
      env.DB.prepare(
        `SELECT insurance_used,
                COUNT(*) as bills_shared,
                AVG(surprise_percentage) as avg_surprise,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final
         FROM reports
         WHERE procedure_type = ? AND city = ? AND quarantined = 0
         GROUP BY insurance_used`
      ).bind(procedure, city),
    ]);

    const overview = results[0].results[0] as Record<string, number> | undefined;
    if (!overview || overview.bills_shared === 0) {
      return { available: false, message: "Not enough data for this combination yet" };
    }

    return {
      available: true,
      bills_shared: overview.bills_shared,
      avg_quoted: Math.round(overview.avg_quoted),
      avg_final: Math.round(overview.avg_final),
      avg_surprise_pct: Math.round(overview.avg_surprise * 100) / 100,
      max_surprise_pct: Math.round(overview.max_surprise * 100) / 100,
      min_surprise_pct: Math.round(overview.min_surprise * 100) / 100,
      by_type_insurance: results[1].results,
      absurd_charges: results[2].results,
      insurance_analysis: results[3].results,
    };
  });
}

export async function handleFeed(url: URL, env: Env): Promise<Response> {
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1") || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20") || 20));
  const offset = (page - 1) * limit;

  const city = url.searchParams.get("city") || "";
  const procedure = url.searchParams.get("procedure") || "";
  const tier = url.searchParams.get("tier") || "";
  const category = url.searchParams.get("category") || "";

  const conditions: string[] = ["quarantined = 0"];
  const bindings: (string | number)[] = [];

  if (city) { conditions.push("city = ?"); bindings.push(city); }
  if (tier) { conditions.push("hospital_tier = ?"); bindings.push(tier); }
  if (procedure) {
    conditions.push("procedure_type = ?");
    bindings.push(procedure);
  } else if (category && category in PROCEDURE_CATEGORIES) {
    const slugs = Object.keys(PROCEDURE_CATEGORIES[category].procedures);
    if (slugs.length > 0) {
      conditions.push(`procedure_type IN (${slugs.map(() => "?").join(",")})`);
      bindings.push(...slugs);
    }
  }

  const whereClause = conditions.join(" AND ");
  const filterParts = [city, procedure || category, tier].filter(Boolean);
  const baseKey = filterParts.length > 0 ? `feed:f:${filterParts.join(":")}` : "feed";
  const feedCacheKey = page === 1 && limit === 20 ? baseKey : `${baseKey}:${page}:${limit}`;

  return cachedResponse(env, feedCacheKey, CACHE_TTL.feed, async () => {
    const results = await env.DB.batch([
      env.DB.prepare(
        `SELECT id, procedure_type, city, state, hospital_tier, insurance_used,
                quoted_amount, final_amount, surprise_percentage, procedure_year, created_at
         FROM reports
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      ).bind(...bindings, limit, offset),
      env.DB.prepare(
        `SELECT COUNT(*) as total FROM reports WHERE ${whereClause}`
      ).bind(...bindings),
    ]);

    const total = (results[1].results[0] as Record<string, unknown>)?.total as number ?? 0;

    return {
      reports: results[0].results,
      page,
      limit,
      total,
      has_more: offset + limit < total,
    };
  });
}

export async function handleInsights(env: Env): Promise<Response> {
  return cachedResponse(env, "insights", CACHE_TTL.stats, async () => {
    const results = await env.DB.batch([
      // Top 10 procedures by avg overbilling %
      env.DB.prepare(
        `SELECT procedure_type,
                SUM(report_count) as reports,
                SUM(avg_surprise_pct * report_count) / SUM(report_count) as avg_surprise,
                SUM(avg_quoted * report_count) / SUM(report_count) as avg_quoted,
                SUM(avg_final * report_count) / SUM(report_count) as avg_final
         FROM aggregates
         GROUP BY procedure_type
         HAVING SUM(report_count) >= 1
         ORDER BY avg_surprise DESC
         LIMIT 10`
      ),
      // Insurance breakdown
      env.DB.prepare(
        `SELECT insurance_used,
                COUNT(*) as reports,
                AVG(surprise_percentage) as avg_surprise,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final
         FROM reports
         WHERE quarantined = 0
         GROUP BY insurance_used`
      ),
      // Hospital tier breakdown
      env.DB.prepare(
        `SELECT hospital_tier,
                SUM(report_count) as reports,
                SUM(avg_surprise_pct * report_count) / SUM(report_count) as avg_surprise
         FROM aggregates
         GROUP BY hospital_tier`
      ),
    ]);

    const topProcedures = (results[0].results as Array<Record<string, unknown>>).map((row) => ({
      procedure_type: row.procedure_type as string,
      display_name: PROCEDURE_TYPES[row.procedure_type as string] || row.procedure_type,
      reports: row.reports as number,
      avg_surprise: Math.round((row.avg_surprise as number) * 100) / 100,
      avg_quoted: Math.round(row.avg_quoted as number),
      avg_final: Math.round(row.avg_final as number),
    }));

    const insuranceBreakdown = (results[1].results as Array<Record<string, unknown>>).map((row) => ({
      insurance_used: row.insurance_used as string,
      reports: row.reports as number,
      avg_surprise: Math.round((row.avg_surprise as number) * 100) / 100,
      avg_quoted: Math.round(row.avg_quoted as number),
      avg_final: Math.round(row.avg_final as number),
    }));

    const tierBreakdown = (results[2].results as Array<Record<string, unknown>>).map((row) => ({
      hospital_tier: row.hospital_tier as string,
      reports: row.reports as number,
      avg_surprise: Math.round((row.avg_surprise as number) * 100) / 100,
    }));

    return {
      top_procedures: topProcedures,
      insurance_breakdown: insuranceBreakdown,
      tier_breakdown: tierBreakdown,
    };
  });
}

export async function handleExploreOverview(
  url: URL,
  env: Env
): Promise<Response> {
  const city = url.searchParams.get("city") || "";
  const category = url.searchParams.get("category") || "";
  const procedure = url.searchParams.get("procedure") || "";
  const tier = url.searchParams.get("tier") || "";

  const conditions: string[] = ["quarantined = 0"];
  const joinConditions: string[] = ["r.quarantined = 0"];
  const bindings: (string | number)[] = [];
  const joinBindings: (string | number)[] = [];

  if (city) {
    conditions.push("city = ?"); bindings.push(city);
    joinConditions.push("r.city = ?"); joinBindings.push(city);
  }
  if (tier) {
    conditions.push("hospital_tier = ?"); bindings.push(tier);
    joinConditions.push("r.hospital_tier = ?"); joinBindings.push(tier);
  }
  if (procedure) {
    conditions.push("procedure_type = ?"); bindings.push(procedure);
    joinConditions.push("r.procedure_type = ?"); joinBindings.push(procedure);
  } else if (category && category in PROCEDURE_CATEGORIES) {
    const slugs = Object.keys(PROCEDURE_CATEGORIES[category].procedures);
    if (slugs.length > 0) {
      conditions.push(`procedure_type IN (${slugs.map(() => "?").join(",")})`);
      bindings.push(...slugs);
      joinConditions.push(`r.procedure_type IN (${slugs.map(() => "?").join(",")})`);
      joinBindings.push(...slugs);
    }
  }

  const where = conditions.join(" AND ");
  const joinWhere = joinConditions.join(" AND ");

  const hasAnyFilter = !!(city || category || procedure || tier);
  const groupDims: string[] = [];
  if (!hasAnyFilter) {
    groupDims.push("city");
  } else {
    if (!city) groupDims.push("city");
    if (!procedure) groupDims.push("procedure_type");
    if (!tier) groupDims.push("hospital_tier");
  }

  const parts = [city, procedure || category, tier].filter(Boolean);
  const cacheKey = parts.length > 0 ? `ov3:${parts.join(":")}` : "ov3:all";

  return cachedResponse(env, cacheKey, CACHE_TTL.overview, async () => {
    const queries = [
      env.DB.prepare(
        `SELECT COUNT(*) as bills_shared,
                COALESCE(AVG(surprise_percentage), 0) as avg_surprise,
                COALESCE(AVG(quoted_amount), 0) as avg_quoted,
                COALESCE(AVG(final_amount), 0) as avg_final,
                COALESCE(SUM(final_amount - quoted_amount), 0) as total_overbilled
         FROM reports WHERE ${where}`
      ).bind(...bindings),
      env.DB.prepare(
        `SELECT insurance_used,
                COUNT(*) as bills_shared,
                AVG(surprise_percentage) as avg_surprise,
                AVG(quoted_amount) as avg_quoted,
                AVG(final_amount) as avg_final
         FROM reports WHERE ${where}
         GROUP BY insurance_used`
      ).bind(...bindings),
      env.DB.prepare(
        `SELECT si.id, si.description, si.amount, si.upvotes,
                r.city, r.hospital_tier, r.procedure_type
         FROM surprise_items si
         JOIN reports r ON si.report_id = r.id
         WHERE ${joinWhere}
         ORDER BY si.upvotes DESC, si.amount DESC
         LIMIT 10`
      ).bind(...joinBindings),
    ];

    if (groupDims.length > 0) {
      const groupBy = groupDims.join(", ");
      queries.push(
        env.DB.prepare(
          `SELECT ${groupBy},
                  COUNT(*) as bills_shared,
                  AVG(quoted_amount) as avg_quoted,
                  AVG(final_amount) as avg_final,
                  AVG(surprise_percentage) as avg_surprise,
                  MAX(surprise_percentage) as max_surprise,
                  MIN(surprise_percentage) as min_surprise
           FROM reports WHERE ${where}
           GROUP BY ${groupBy}
           HAVING COUNT(*) >= 1
           ORDER BY COUNT(*) DESC
           LIMIT 30`
        ).bind(...bindings)
      );
    }

    const results = await env.DB.batch(queries);
    const kpis = results[0].results[0] as Record<string, unknown> | undefined;

    const insurance = (results[1].results as Array<Record<string, unknown>>).map(row => ({
      insurance_used: row.insurance_used as string,
      bills_shared: row.bills_shared as number,
      avg_surprise: Math.round((row.avg_surprise as number) * 100) / 100,
      avg_quoted: Math.round(row.avg_quoted as number),
      avg_final: Math.round(row.avg_final as number),
    }));

    return {
      kpis: {
        bills_shared: kpis?.bills_shared ?? 0,
        avg_surprise: Math.round((kpis?.avg_surprise as number ?? 0) * 100) / 100,
        avg_quoted: Math.round(kpis?.avg_quoted as number ?? 0),
        avg_final: Math.round(kpis?.avg_final as number ?? 0),
        total_overbilled: kpis?.total_overbilled ?? 0,
      },
      dimensions: groupDims,
      table: groupDims.length > 0 ? results[3].results : [],
      insurance,
      absurd_charges: results[2].results,
    };
  });
}

export async function handleCities(): Promise<Response> {
  const cities = Object.entries(CITY_STATE_MAP).map(([slug, state]) => ({
    slug,
    name: slug
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" "),
    state,
  }));

  return jsonResponse({ ok: true, data: cities });
}

export async function handleProcedures(): Promise<Response> {
  const procedures = Object.entries(PROCEDURE_CATEGORIES).flatMap(
    ([catSlug, cat]) =>
      Object.entries(cat.procedures).map(([slug, name]) => ({
        slug,
        name,
        category: catSlug,
        categoryName: cat.name,
      }))
  );
  procedures.push({
    slug: "other",
    name: "Other",
    category: "other",
    categoryName: "Other",
  });

  return jsonResponse({ ok: true, data: procedures });
}

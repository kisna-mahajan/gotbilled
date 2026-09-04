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
};

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

    const procToCat: Record<string, string> = {};
    for (const [catSlug, cat] of Object.entries(PROCEDURE_CATEGORIES)) {
      for (const procSlug of Object.keys(cat.procedures)) {
        procToCat[procSlug] = catSlug;
      }
    }

    const catAgg: Record<string, { reports: number; weightedSurprise: number }> = {};
    for (const row of procedureRows) {
      const cat = procToCat[row.procedure_type] || "other";
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
         ORDER BY si.upvotes DESC, si.created_at DESC
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
  const tier = url.searchParams.get("tier");

  if (!procedure || !city) {
    return jsonResponse(
      { ok: false, error: "procedure and city are required" },
      400
    );
  }

  const cacheKey = `calc2:${procedure}:${city}${tier ? `:${tier}` : ""}`;

  return cachedResponse(env, cacheKey, CACHE_TTL.calculator, async () => {
    let query = `SELECT report_count, avg_quoted, avg_final, avg_surprise_pct,
                        max_surprise_pct, min_surprise_pct
                 FROM aggregates
                 WHERE procedure_type = ? AND city = ?`;
    const bindings: (string | number)[] = [procedure, city];

    if (tier) {
      query += " AND hospital_tier = ?";
      bindings.push(tier);
    }

    const result = await env.DB.prepare(query).bind(...bindings).all();

    if (result.results.length === 0) {
      return { available: false, message: "Not enough data for this combination yet" };
    }

    let totalCount = 0;
    let weightedQuoted = 0;
    let weightedFinal = 0;
    let weightedSurprise = 0;
    let maxSurprise = -Infinity;
    let minSurprise = Infinity;

    for (const row of result.results) {
      const r = row as Record<string, number>;
      totalCount += r.report_count;
      weightedQuoted += r.avg_quoted * r.report_count;
      weightedFinal += r.avg_final * r.report_count;
      weightedSurprise += r.avg_surprise_pct * r.report_count;
      maxSurprise = Math.max(maxSurprise, r.max_surprise_pct);
      minSurprise = Math.min(minSurprise, r.min_surprise_pct);
    }

    return {
      available: true,
      report_count: totalCount,
      avg_quoted: Math.round(weightedQuoted / totalCount),
      avg_final: Math.round(weightedFinal / totalCount),
      avg_surprise_pct: Math.round((weightedSurprise / totalCount) * 100) / 100,
      max_surprise_pct: Math.round(maxSurprise * 100) / 100,
      min_surprise_pct: Math.round(minSurprise * 100) / 100,
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

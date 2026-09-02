import { Env, ReportInput, ApiResponse } from "./types";
import { CITY_STATE_MAP, RATE_LIMIT_PER_DAY } from "./data";
import { validateReport } from "./validation";

async function hashIP(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(ip + salt);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function handleSubmit(
  request: Request,
  env: Env
): Promise<Response> {
  let body: ReportInput;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const validation = validateReport(body);
  if (!validation.valid) {
    return jsonResponse({ ok: false, error: validation.error }, 400);
  }

  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  const salt = env.IP_HASH_SALT || "gotbilled-default-salt";
  const ipHash = await hashIP(clientIP, salt);

  const rateCheck = await env.DB.prepare(
    `SELECT COUNT(*) as cnt FROM reports
     WHERE ip_hash = ? AND created_at > datetime('now', '-1 day')`
  )
    .bind(ipHash)
    .first<{ cnt: number }>();

  if (rateCheck && rateCheck.cnt >= RATE_LIMIT_PER_DAY) {
    return jsonResponse(
      { ok: false, error: "You've reached the daily submission limit. Try again tomorrow." },
      429
    );
  }

  const reportId = crypto.randomUUID();
  const state = CITY_STATE_MAP[body.city];
  const surprisePct =
    ((body.final_amount - body.quoted_amount) / body.quoted_amount) * 100;
  const surprisePctRounded = Math.round(surprisePct * 100) / 100;

  const insertReport = env.DB.prepare(
    `INSERT INTO reports (id, ip_hash, procedure_type, procedure_other, city, state,
      hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage,
      stay_days, procedure_year, flagged, quarantined)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    reportId,
    ipHash,
    body.procedure_type,
    body.procedure_other?.trim() || null,
    body.city,
    state,
    body.hospital_tier,
    body.insurance_used,
    body.quoted_amount,
    body.final_amount,
    surprisePctRounded,
    body.stay_days ?? null,
    body.procedure_year,
    validation.flagged ? 1 : 0,
    0
  );

  const statements: D1PreparedStatement[] = [insertReport];

  if (body.surprise_charges && body.surprise_charges.length > 0) {
    for (const item of body.surprise_charges) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO surprise_items (id, report_id, description, amount)
           VALUES (?, ?, ?, ?)`
        ).bind(crypto.randomUUID(), reportId, item.description.trim(), item.amount)
      );
    }
  }

  // Incremental aggregate update using corrected running average formula:
  // new_avg = ((old_avg * old_count) + new_value) / (old_count + 1)
  statements.push(
    env.DB.prepare(
      `INSERT INTO aggregates (city, procedure_type, hospital_tier, report_count,
        avg_quoted, avg_final, avg_surprise_pct, max_surprise_pct, min_surprise_pct)
       VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)
       ON CONFLICT(city, procedure_type, hospital_tier) DO UPDATE SET
        report_count = report_count + 1,
        avg_quoted = ((avg_quoted * report_count) + excluded.avg_quoted) / (report_count + 1),
        avg_final = ((avg_final * report_count) + excluded.avg_final) / (report_count + 1),
        avg_surprise_pct = ((avg_surprise_pct * report_count) + excluded.avg_surprise_pct) / (report_count + 1),
        max_surprise_pct = MAX(max_surprise_pct, excluded.max_surprise_pct),
        min_surprise_pct = MIN(min_surprise_pct, excluded.min_surprise_pct),
        updated_at = datetime('now')`
    ).bind(
      body.city,
      body.procedure_type,
      body.hospital_tier,
      body.quoted_amount,
      body.final_amount,
      surprisePctRounded,
      surprisePctRounded,
      surprisePctRounded
    )
  );

  if (validation.flagged) {
    statements.push(
      env.DB.prepare(
        `INSERT INTO moderation_log (id, report_id, reason, auto_action)
         VALUES (?, ?, ?, 'flagged')`
      ).bind(crypto.randomUUID(), reportId, validation.flagReasons.join(", "))
    );
  }

  try {
    await env.DB.batch(statements);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonResponse({ ok: false, error: "Failed to save report: " + message }, 500);
  }

  return jsonResponse({
    ok: true,
    data: {
      id: reportId,
      surprise_percentage: surprisePctRounded,
      flagged: validation.flagged,
    },
  });
}

export async function handleUpvote(
  itemId: string,
  request: Request,
  env: Env
): Promise<Response> {
  const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
  const salt = env.IP_HASH_SALT || "gotbilled-default-salt";
  const ipHash = await hashIP(clientIP, salt);

  const existing = await env.DB.prepare(
    `SELECT 1 FROM upvote_tracking WHERE item_id = ? AND ip_hash = ?`
  )
    .bind(itemId, ipHash)
    .first();

  if (existing) {
    return jsonResponse({ ok: false, error: "Already upvoted" }, 409);
  }

  const item = await env.DB.prepare(
    `SELECT id FROM surprise_items WHERE id = ?`
  )
    .bind(itemId)
    .first();

  if (!item) {
    return jsonResponse({ ok: false, error: "Item not found" }, 404);
  }

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO upvote_tracking (id, item_id, ip_hash) VALUES (?, ?, ?)`
      ).bind(crypto.randomUUID(), itemId, ipHash),
      env.DB.prepare(
        `UPDATE surprise_items SET upvotes = upvotes + 1 WHERE id = ?`
      ).bind(itemId),
    ]);
  } catch {
    return jsonResponse({ ok: false, error: "Failed to upvote" }, 500);
  }

  return jsonResponse({ ok: true });
}

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

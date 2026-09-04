import { Env, ReportInput, ApiResponse, QueueMessage } from "./types";
import { CITY_STATE_MAP, RATE_LIMIT_PER_DAY, PROCEDURE_CATEGORIES } from "./data";
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

  // Turnstile verification (skip if no secret configured)
  if (env.TURNSTILE_SECRET) {
    const token = body.turnstile_token;
    if (!token) {
      return jsonResponse({ ok: false, error: "Please complete the verification" }, 400);
    }
    const formData = new FormData();
    formData.append("secret", env.TURNSTILE_SECRET);
    formData.append("response", token);
    formData.append("remoteip", request.headers.get("CF-Connecting-IP") || "");

    const turnstileRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
    });
    const turnstileResult = await turnstileRes.json() as { success: boolean };
    if (!turnstileResult.success) {
      return jsonResponse({ ok: false, error: "Verification failed. Please try again." }, 400);
    }
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

  const message: QueueMessage = {
    type: "report",
    reportId,
    ipHash,
    procedureType: body.procedure_type,
    procedureOther: body.procedure_other?.trim() || null,
    city: body.city,
    state,
    hospitalTier: body.hospital_tier,
    insuranceUsed: body.insurance_used,
    quotedAmount: body.quoted_amount,
    finalAmount: body.final_amount,
    surprisePercentage: surprisePctRounded,
    stayDays: body.stay_days ?? null,
    procedureYear: body.procedure_year,
    flagged: validation.flagged,
    flagReasons: validation.flagReasons,
    surpriseCharges: body.surprise_charges || [],
  };

  try {
    await env.SUBMISSIONS_QUEUE.send(message);
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: "We're experiencing high traffic. Please try again in a moment." }),
      { status: 503, headers: { "Content-Type": "application/json", "Retry-After": "30" } }
    );
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
        `INSERT INTO upvote_tracking (item_id, ip_hash) VALUES (?, ?)`
      ).bind(itemId, ipHash),
      env.DB.prepare(
        `UPDATE surprise_items SET upvotes = upvotes + 1 WHERE id = ?`
      ).bind(itemId),
    ]);
  } catch {
    return jsonResponse({ ok: false, error: "Failed to upvote" }, 500);
  }

  await invalidateCache(env, ["stats", "absurd"]);

  return jsonResponse({ ok: true });
}

export async function processQueueBatch(
  batch: MessageBatch<QueueMessage>,
  env: Env
): Promise<void> {
  const keysToInvalidate = new Set<string>();
  keysToInvalidate.add("stats");
  keysToInvalidate.add("feed");

  for (const msg of batch.messages) {
    const m = msg.body;

    // Additional outlier detection in consumer
    if (m.surprisePercentage > 300) {
      if (!m.flagged) { m.flagged = true; }
      m.flagReasons.push("extreme_surprise_pct");
    }
    if (m.finalAmount > 3_000_000) {
      if (!m.flagged) { m.flagged = true; }
      m.flagReasons.push("extreme_final_amount");
    }

    const statements: D1PreparedStatement[] = [];

    statements.push(
      env.DB.prepare(
        `INSERT INTO reports (id, ip_hash, procedure_type, procedure_other, city, state,
          hospital_tier, insurance_used, quoted_amount, final_amount, surprise_percentage,
          stay_days, procedure_year, flagged, quarantined)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        m.reportId,
        m.ipHash,
        m.procedureType,
        m.procedureOther,
        m.city,
        m.state,
        m.hospitalTier,
        m.insuranceUsed,
        m.quotedAmount,
        m.finalAmount,
        m.surprisePercentage,
        m.stayDays,
        m.procedureYear,
        m.flagged ? 1 : 0,
        0
      )
    );

    for (const item of m.surpriseCharges) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO surprise_items (id, report_id, description, amount)
           VALUES (?, ?, ?, ?)`
        ).bind(crypto.randomUUID(), m.reportId, item.description.trim(), item.amount)
      );
    }

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
        m.city,
        m.procedureType,
        m.hospitalTier,
        m.quotedAmount,
        m.finalAmount,
        m.surprisePercentage,
        m.surprisePercentage,
        m.surprisePercentage
      )
    );

    if (m.flagged) {
      statements.push(
        env.DB.prepare(
          `INSERT INTO moderation_log (id, report_id, field_name, original_text, redaction_reason)
           VALUES (?, ?, 'auto_flag', ?, 'pii')`
        ).bind(crypto.randomUUID(), m.reportId, m.flagReasons.join(", "))
      );
    }

    try {
      await env.DB.batch(statements);
      msg.ack();
    } catch {
      msg.retry();
    }

    keysToInvalidate.add(`city:${m.city}`);
    keysToInvalidate.add(`procedure:${m.procedureType}`);

    const procToCat: Record<string, string> = {};
    for (const [catSlug, cat] of Object.entries(PROCEDURE_CATEGORIES)) {
      for (const procSlug of Object.keys(cat.procedures)) {
        procToCat[procSlug] = catSlug;
      }
    }
    const cat = procToCat[m.procedureType];
    if (cat) keysToInvalidate.add(`category:${cat}`);

    keysToInvalidate.add(`calculator:${m.procedureType}:${m.city}`);
    keysToInvalidate.add(`calculator:${m.procedureType}:${m.city}:${m.hospitalTier}`);

    if (m.surpriseCharges.length > 0) {
      keysToInvalidate.add("absurd");
    }
  }

  // Velocity-based batch flagging
  for (const msg of batch.messages) {
    const m = msg.body;
    const velocityKey = `velocity:${m.city}:${m.procedureType}:${m.hospitalTier}`;
    const current = parseInt(await env.CACHE.get(velocityKey) || "0");
    if (current > 50) {
      // Flag this report for review — store in moderation_log
      await env.DB.prepare(
        `INSERT INTO moderation_log (id, report_id, field_name, original_text, redaction_reason)
         VALUES (?, ?, 'velocity_flag', ?, 'velocity')`
      ).bind(crypto.randomUUID(), m.reportId, `${current + 1} submissions for ${m.city}/${m.procedureType}/${m.hospitalTier} in 1 hour`).run();
    }
    await env.CACHE.put(velocityKey, String(current + 1), { expirationTtl: 3600 });
  }

  await invalidateCache(env, [...keysToInvalidate]);
}

async function invalidateCache(env: Env, keys: string[]): Promise<void> {
  await Promise.allSettled(keys.map((k) => env.CACHE.delete(`cache:${k}`)));
}

function jsonResponse<T>(body: ApiResponse<T>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

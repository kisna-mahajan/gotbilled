import { Env, QueueMessage } from "./types";
import { handleSubmit, handleUpvote, processQueueBatch } from "./submit";
import {
  handleStats,
  handleCityPage,
  handleProcedurePage,
  handleAbsurdFeed,
  handleCalculator,
  handleFeed,
  handleCities,
  handleProcedures,
} from "./read";

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function addCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders())) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      let response: Response;

      if (request.method === "POST" && path === "/api/report") {
        response = await handleSubmit(request, env);
      } else if (request.method === "POST" && path.startsWith("/api/upvote/")) {
        const itemId = path.split("/api/upvote/")[1];
        if (!itemId) return addCors(jsonError("Item ID required", 400));
        response = await handleUpvote(itemId, request, env);
      } else if (request.method === "GET" && path === "/api/stats") {
        response = await handleStats(env);
      } else if (request.method === "GET" && path.startsWith("/api/city/")) {
        const city = path.split("/api/city/")[1];
        if (!city) return addCors(jsonError("City required", 400));
        response = await handleCityPage(city, env);
      } else if (request.method === "GET" && path.startsWith("/api/procedure/")) {
        const procedure = path.split("/api/procedure/")[1];
        if (!procedure) return addCors(jsonError("Procedure required", 400));
        response = await handleProcedurePage(procedure, env);
      } else if (request.method === "GET" && path === "/api/absurd") {
        response = await handleAbsurdFeed(url, env);
      } else if (request.method === "GET" && path === "/api/calculator") {
        response = await handleCalculator(url, env);
      } else if (request.method === "GET" && path === "/api/feed") {
        response = await handleFeed(url, env);
      } else if (request.method === "GET" && path === "/api/cities") {
        response = await handleCities();
      } else if (request.method === "GET" && path === "/api/procedures") {
        response = await handleProcedures();
      } else if (path === "/api/health") {
        response = new Response(JSON.stringify({ ok: true, timestamp: new Date().toISOString() }), {
          headers: { "Content-Type": "application/json" },
        });
      } else {
        response = jsonError("Not found", 404);
      }

      return addCors(response);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Internal server error";
      return addCors(jsonError(message, 500));
    }
  },

  async queue(batch: MessageBatch<QueueMessage>, env: Env): Promise<void> {
    await processQueueBatch(batch, env);
  },
};

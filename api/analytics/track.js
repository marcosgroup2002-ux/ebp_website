import { createClient } from "@supabase/supabase-js";

/**
 * Route API Vercel : /api/analytics/track
 * Point d'entrée serveur alternatif pour la mesure d'audience.
 * N'utilise que la clé anon : l'écriture passe par la RPC track_visit, qui valide les données.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DEVICE_TYPES = ["mobile", "desktop", "tablet"];

function allowedOrigins(req) {
  const configured = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const host = req.headers.host;
  return host ? [...configured, `https://${host}`] : configured;
}

function text(value, max) {
  return typeof value === "string" && value.length > 0 ? value.slice(0, max) : null;
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const allowed = allowedOrigins(req);

  if (origin) {
    if (!allowed.includes(origin)) return res.status(403).json({ error: "Origin not allowed" });
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res.status(500).json({ error: "Service unavailable" });

  let body = req.body;
  if (typeof body === "string") {
    if (body.length > 4000) return res.status(413).json({ error: "Payload too large" });
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }
  if (!body || typeof body !== "object") return res.status(400).json({ error: "Invalid payload" });

  const visitorId = typeof body.visitor_id === "string" ? body.visitor_id.toLowerCase() : "";
  if (!UUID_REGEX.test(visitorId)) return res.status(400).json({ error: "Invalid visitor_id" });

  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
  const { error } = await supabase.rpc("track_visit", {
    p_visitor_id: visitorId,
    p_device_type: DEVICE_TYPES.includes(body.device_type) ? body.device_type : "desktop",
    p_operating_system: text(body.operating_system, 40),
    p_browser: text(body.browser, 40),
    p_utm_source: text(body.utm_source, 100),
    p_utm_medium: text(body.utm_medium, 100),
    p_utm_campaign: text(body.utm_campaign, 100),
    p_utm_term: text(body.utm_term, 100),
    p_utm_content: text(body.utm_content, 100),
    p_page_path: text(body.page_path, 300),
    p_referrer: text(body.referrer, 500),
  });

  if (error) {
    console.error("[api/analytics/track] Supabase error:", error.message);
    return res.status(500).json({ error: "Tracking failed" });
  }
  return res.status(204).end();
}

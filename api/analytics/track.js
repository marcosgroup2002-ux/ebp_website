import { createClient } from "@supabase/supabase-js";

/**
 * Route API Vercel Serverless Function : /api/analytics/track
 * Reçoit le payload client et insère le visiteur unique dans Supabase
 * Règle d'unicité : ON CONFLICT (visitor_id)
 */
export default async function handler(req, res) {
  // En-têtes CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl =
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: "Supabase credentials missing" });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const {
      visitor_id,
      device_type,
      operating_system,
      browser,
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      page_path,
      referrer,
    } = body || {};

    if (!visitor_id) {
      return res.status(400).json({ error: "visitor_id required" });
    }

    const { error } = await supabase
      .from("analytics_visitors")
      .upsert(
        {
          visitor_id,
          device_type: device_type || "desktop",
          operating_system: operating_system || "Inconnu",
          browser: browser || "Inconnu",
          utm_source: (utm_source || "direct").toLowerCase(),
          utm_medium: (utm_medium || "none").toLowerCase(),
          utm_campaign: (utm_campaign || "organic").toLowerCase(),
          utm_term,
          utm_content,
          page_path: page_path || "/",
          referrer: referrer ? referrer.slice(0, 500) : "direct",
          last_seen: new Date().toISOString(),
        },
        {
          onConflict: "visitor_id",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error("[api/analytics/track] Supabase error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, visitor_id });
  } catch (err) {
    console.error("[api/analytics/track] Exception:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}

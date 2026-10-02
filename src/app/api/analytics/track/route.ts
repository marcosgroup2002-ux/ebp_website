import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Route API Next.js App Router : POST /api/analytics/track
 * Règle Machine Unique : 1 Appareil = 1 Compte
 */
export async function POST(request: Request) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Supabase environment variables are missing." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();

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
      return NextResponse.json(
        { error: "visitor_id is required" },
        { status: 400 }
      );
    }

    // Insertion avec gestion silencieuse des doublons (ON CONFLICT DO NOTHING)
    const { data, error } = await supabase
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
      )
      .select("id, visitor_id")
      .maybeSingle();

    if (error) {
      console.error("[POST /api/analytics/track] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, visitor_id, data },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[POST /api/analytics/track] Exception:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

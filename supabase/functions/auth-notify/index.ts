// Journalise chaque connexion à l'espace admin avec l'IP réelle (vue côté serveur)
// et alerte la direction par email lors d'une connexion du secrétariat.
//
// Secrets (supabase secrets set ...) :
//   RESEND_API_KEY   clé Resend (jamais exposée au navigateur)
//   PDG_ALERT_EMAIL  destinataire des alertes, fixé côté serveur
//   SENDER_EMAIL     expéditeur vérifié dans Resend (défaut : onboarding@resend.dev)
//   ALLOWED_ORIGINS  origines autorisées, séparées par des virgules
// SUPABASE_URL, SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY sont fournis par la plateforme.

import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin =
    allowedOrigins.length === 0 ? "*" : origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip");
  return ip ? ip.slice(0, 64) : null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405, origin);

  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Non authentifié" }, 401, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData?.user) return json({ error: "Session invalide" }, 401, origin);
  const user = userData.user;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("nom, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) return json({ error: "Profil indisponible" }, 500, origin);
  if (!profile) return json({ error: "Aucun rôle attribué" }, 403, origin);

  const ip = clientIp(req);
  const userAgent = (req.headers.get("user-agent") ?? "inconnu").slice(0, 200);

  const { error: auditError } = await admin.from("audit_logs").insert({
    action: "CONNEXION",
    details: `Connexion réussie (${userAgent}).`,
    user_name: profile.nom,
    user_role: profile.role,
    user_id: user.id,
    ip_address: ip,
  });
  if (auditError) return json({ error: "Journalisation impossible" }, 500, origin);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const pdgEmail = Deno.env.get("PDG_ALERT_EMAIL");
  let alertSent = false;

  if (profile.role === "secretaire" && resendKey && pdgEmail) {
    const sender = Deno.env.get("SENDER_EMAIL") ?? "onboarding@resend.dev";
    const when = new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
      body: JSON.stringify({
        from: `EBP Admin <${sender}>`,
        to: [pdgEmail],
        subject: "[EBP Admin] Connexion du secrétariat",
        text: `${profile.nom} s'est connecté(e) à l'espace admin le ${when}. IP : ${ip ?? "inconnue"}.`,
        html: `<p><strong>${escapeHtml(profile.nom)}</strong> s'est connecté(e) à l'espace admin le ${escapeHtml(when)}.</p><p>IP : ${escapeHtml(ip ?? "inconnue")}</p><p>Si ce n'est pas normal, désactivez le compte dans Supabase (Authentication &gt; Users).</p>`,
      }),
    });
    alertSent = res.ok;
    if (!res.ok) console.error("[auth-notify] Resend a refusé l'envoi :", res.status, await res.text());
  }

  return json({ ok: true, alertSent }, 200, origin);
});

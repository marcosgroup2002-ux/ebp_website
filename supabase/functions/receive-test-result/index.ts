// Reçoit chaque réponse du Google Form « Level Test EBP » (envoyée par Google Apps Script)
// et l'enregistre dans test_results pour l'espace secrétariat.
//
// Authentification : en-tête x-webhook-token. Seule l'empreinte SHA-256 du jeton est stockée
// (table integration_tokens) ; la fonction est donc appelable sans session Supabase.

import { createClient } from "jsr:@supabase/supabase-js@2";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
const PASS_RATE = 0.6;
const MAX_BODY = 60_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function sha256Hex(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const text = (value: unknown, max: number) => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed.length ? trimmed : null;
};

const num = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= 100_000 ? n : null;
};

// Niveau estimé : on monte de A1 à C2 tant que le candidat réussit au moins 60 % des questions du niveau.
function estimateLevel(byLevel: Record<string, [number, number]>) {
  let best = "Pré-A1";
  for (const level of LEVELS) {
    const entry = byLevel[level];
    if (!entry || entry[1] === 0) continue;
    if (entry[0] / entry[1] >= PASS_RATE) best = level;
    else break;
  }
  return best;
}

function cleanLevels(raw: unknown) {
  const out: Record<string, [number, number]> = {};
  if (!raw || typeof raw !== "object") return out;
  for (const level of LEVELS) {
    const entry = (raw as Record<string, unknown>)[level];
    if (!Array.isArray(entry) || entry.length !== 2) continue;
    const ok = Math.trunc(Number(entry[0]));
    const total = Math.trunc(Number(entry[1]));
    if (Number.isInteger(ok) && Number.isInteger(total) && total > 0 && total <= 200 && ok >= 0 && ok <= total) {
      out[level] = [ok, total];
    }
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const token = req.headers.get("x-webhook-token");
  if (!token) return json({ error: "Jeton manquant" }, 401);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return json({ error: "Requête trop volumineuse" }, 413);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: stored, error: tokenError } = await db
    .from("integration_tokens")
    .select("token_hash")
    .eq("name", "google_form_level_test")
    .maybeSingle();
  if (tokenError || !stored) return json({ error: "Service indisponible" }, 500);
  if (!safeEqual(await sha256Hex(token), stored.token_hash)) return json({ error: "Jeton invalide" }, 401);

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }

  const nom = text(body.nom, 120);
  if (!nom || nom.length < 2) return json({ error: "Nom manquant" }, 400);

  const parNiveau = cleanLevels(body.par_niveau);
  const hasLevels = Object.keys(parNiveau).length > 0;
  const score = num(body.score);
  const scoreMax = num(body.score_max);
  if (score !== null && scoreMax !== null && score > scoreMax) return json({ error: "Score incohérent" }, 400);

  const submitted = typeof body.submitted_at === "string" ? new Date(body.submitted_at) : null;
  const niveau = hasLevels ? estimateLevel(parNiveau) : null;

  const { data, error } = await db
    .from("test_results")
    .upsert(
      {
        external_id: text(body.external_id, 120),
        nom,
        contact: text(body.contact, 150),
        score,
        score_max: scoreMax,
        niveau_estime: niveau,
        detail_niveaux: hasLevels ? parNiveau : null,
        redaction: text(body.redaction, 6000),
        source: "google_form",
        passe_le: submitted && !isNaN(submitted.getTime()) ? submitted.toISOString() : new Date().toISOString(),
      },
      { onConflict: "external_id", ignoreDuplicates: true }
    )
    .select("id");

  if (error) {
    console.error("[receive-test-result] insertion refusée :", error.message);
    return json({ error: "Enregistrement impossible" }, 500);
  }
  if (!data || data.length === 0) return json({ ok: true, duplicate: true });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await db.from("audit_logs").insert({
    action: "TEST_NIVEAU_RECU",
    details: `Résultat reçu de Google Forms : ${nom}${niveau ? ` (niveau estimé ${niveau})` : ""}.`,
    user_name: "Google Forms",
    user_role: "system",
    ip_address: ip,
  });

  return json({ ok: true, id: data[0].id, niveau_estime: niveau });
});

import { requireSupabase, toUserMessage } from "../lib/supabaseClient";

export const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
export const ALL_LEVELS = ["Pré-A1", ...LEVELS];

export const LEVEL_INFO = {
  "Pré-A1": "Grand débutant",
  A1: "Débutant",
  A2: "Élémentaire",
  B1: "Intermédiaire",
  B2: "Intermédiaire avancé",
  C1: "Avancé",
  C2: "Maîtrise",
};

export const STATUS_INFO = {
  nouveau: { label: "Nouveau", classes: "bg-ebp-blue/10 text-ebp-blue" },
  contacte: { label: "Contacté", classes: "bg-amber-100 text-amber-800" },
  transmis: { label: "Transmis au PDG", classes: "bg-ebp-green/10 text-ebp-green" },
};

const COLUMNS =
  "id, nom, contact, score, score_max, niveau_estime, niveau_valide, detail_niveaux, redaction, source, statut, note, passe_le, transmis_at, transmis_par";

export async function fetchTestResults() {
  const { data, error } = await requireSupabase()
    .from("test_results")
    .select(COLUMNS)
    .order("passe_le", { ascending: false })
    .limit(500);
  if (error) throw new Error(toUserMessage(error, "Impossible de charger les résultats des tests."));
  return data;
}

export async function addTestResult({ nom, contact, score, scoreMax, niveau, note }) {
  const { error } = await requireSupabase().rpc("add_test_result", {
    p_nom: nom,
    p_contact: contact || null,
    p_score: score,
    p_score_max: scoreMax,
    p_niveau: niveau || null,
    p_note: note || null,
  });
  if (error) throw new Error(toUserMessage(error, "Ajout du résultat impossible."));
}

export async function reviewTestResult(id, niveau, note) {
  const { error } = await requireSupabase().rpc("review_test_result", {
    p_id: id,
    p_niveau_valide: niveau || null,
    p_note: note || null,
  });
  if (error) throw new Error(toUserMessage(error, "Enregistrement de l'évaluation impossible."));
}

export async function setTestStatus(id, statut) {
  const { error } = await requireSupabase().rpc("set_test_result_status", { p_id: id, p_statut: statut });
  if (error) throw new Error(toUserMessage(error, "Changement de statut impossible."));
}

export async function deleteTestResult(id) {
  const { error } = await requireSupabase().rpc("delete_test_result", { p_id: id });
  if (error) throw new Error(toUserMessage(error, "Suppression impossible."));
}

export function finalLevel(result) {
  return result.niveau_valide || result.niveau_estime || null;
}

export function scorePercent(result) {
  if (result.score == null || !result.score_max) return null;
  return Math.round((Number(result.score) / Number(result.score_max)) * 100);
}

// Lien de contact direct : email, ou WhatsApp (indicatif Bénin 229 ajouté si absent).
export function contactLink(contact) {
  if (!contact) return null;
  const value = contact.trim();
  if (value.includes("@")) return { href: `mailto:${value}`, label: "Écrire un email" };
  const digits = value.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const international = value.startsWith("+") || (digits.startsWith("229") && digits.length >= 11);
  return { href: `https://wa.me/${international ? digits : `229${digits}`}`, label: "Écrire sur WhatsApp" };
}

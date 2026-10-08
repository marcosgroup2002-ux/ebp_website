import { requireSupabase, toUserMessage } from "../lib/supabaseClient";
import { REMINDER_TEMPLATES } from "../data/adminData";

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export function computeStatus(learner, today = new Date()) {
  if (learner.paid >= learner.total) return "solde";
  if (!learner.nextDueDate) return "a_jour";

  const due = new Date(learner.nextDueDate);
  const graceEnd = new Date(due);
  graceEnd.setDate(graceEnd.getDate() + 10);

  if (today > graceEnd) return "suspendu";
  if (today > due) return "en_retard";
  return "a_jour";
}

function toLearner(row) {
  const history = (row.paiements || [])
    .map((p) => ({
      id: p.id,
      amount: Number(p.montant),
      mode: p.mode,
      date: p.date_paiement,
    }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const paid = history.reduce((sum, p) => sum + p.amount, 0);
  const learner = {
    id: row.id,
    name: row.nom,
    centre: row.centre,
    cohort: `Cohorte ${row.cohorte} · ${row.centre}`,
    rawCohort: row.cohorte,
    option: row.option_paiement,
    total: Number(row.total),
    paid,
    nextDueDate: row.prochaine_echeance,
    history,
  };
  learner.status = computeStatus(learner);
  return learner;
}

export async function fetchLearners() {
  const { data, error } = await requireSupabase()
    .from("apprenants")
    .select("id, nom, centre, cohorte, option_paiement, total, prochaine_echeance, paiements (id, montant, mode, date_paiement)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(toUserMessage(error, "Impossible de charger les apprenants."));
  return data.map(toLearner);
}

export async function createLearner(payload) {
  const { error } = await requireSupabase().rpc("create_learner", {
    p_nom: payload.name.trim(),
    p_centre: payload.center,
    p_cohorte: payload.cohortNumber,
    p_option: payload.option,
    p_versement: payload.initialPayment ?? 0,
    p_mode: payload.paymentMode,
  });
  if (error) throw new Error(toUserMessage(error, "Inscription impossible."));
  return fetchLearners();
}

export async function recordPayment(learnerId, payment) {
  const { error } = await requireSupabase().rpc("record_payment", {
    p_apprenant: learnerId,
    p_montant: payment.amount,
    p_mode: payment.mode,
    p_date: payment.date,
  });
  if (error) throw new Error(toUserMessage(error, "Enregistrement du paiement impossible."));
  return fetchLearners();
}

export async function deleteLearner(learnerId) {
  const { error } = await requireSupabase().rpc("delete_learner", { p_apprenant: learnerId });
  if (error) throw new Error(toUserMessage(error, "Suppression impossible."));
  return fetchLearners();
}

export function getOverdueLearners(learners, stage, today = new Date()) {
  return learners.filter((l) => {
    if (!l.nextDueDate || l.paid >= l.total) return false;
    const due = new Date(l.nextDueDate);
    const daysLate = Math.floor((today - due) / (1000 * 60 * 60 * 24));
    if (stage === "J5") return daysLate >= 5 && daysLate < 10;
    if (stage === "J10") return daysLate >= 10;
    return false;
  });
}

export function buildReminderMessage(learner, stage) {
  const firstName = learner.name.split(" ")[0];
  const month = MONTHS_FR[new Date().getMonth()];
  const amount = (learner.total - learner.paid).toLocaleString("fr-FR");
  return REMINDER_TEMPLATES[stage]({ firstName, month, amount });
}

// Neutralise les formules (=, +, -, @) qu'Excel exécuterait à l'ouverture du CSV.
export function csvCell(value) {
  let text = String(value ?? "");
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCSV(headers, rows) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

export function learnersToCSV(learners) {
  const headers = ["ID", "Nom", "Centre", "Cohorte", "Option", "Total", "Payé", "Restant", "Statut", "Prochaine échéance"];
  const rows = learners.map((l) => [
    l.id,
    l.name,
    l.centre ?? "",
    l.cohort,
    l.option,
    l.total,
    l.paid,
    l.total - l.paid,
    l.status,
    l.nextDueDate ?? "",
  ]);
  return toCSV(headers, rows);
}

export function downloadTextFile(filename, content, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob(["﻿" + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

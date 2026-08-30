// ============================================================================
// SERVICE PAIEMENTS : couche d'accès aux données, isolée des composants React
// ============================================================================
// Aujourd'hui, ces fonctions lisent/écrivent en mémoire (données de démo).
// Chaque fonction est écrite comme si elle appelait déjà une vraie API
// (signatures async, pas de mutation cachée) pour que le passage à Google
// Sheets ou Supabase soit un remplacement de corps de fonction, pas une
// réécriture des composants qui les appellent. Voir docs/backend-integration.md.

import { REMINDER_TEMPLATES } from "../data/adminData";

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

let idCounter = 1000;
function nextId() {
  idCounter += 1;
  return `L-${idCounter}`;
}

/**
 * Recalcule le statut d'un apprenant à partir de son solde et de sa date
 * d'échéance. Logique simplifiée pour la démo : la vraie règle de
 * suspension (Playbook 3.3, J+11) doit être appliquée côté backend, avec
 * la date du jour comparée à la date d'échéance + délai de grâce.
 */
export function computeStatus(learner, today = new Date()) {
  if (learner.paid >= learner.total) return "solde";
  if (!learner.nextDueDate) return "a_jour";

  const due = new Date(learner.nextDueDate);
  const graceEnd = new Date(due);
  graceEnd.setDate(graceEnd.getDate() + 10); // 10 jours de grâce (Playbook 3.3)

  if (today > graceEnd) return "suspendu";
  if (today > due) return "en_retard";
  return "a_jour";
}

/** Simule un appel réseau : à remplacer par un vrai fetch()/supabase.from(). */
function simulateLatency(value, ms = 250) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** GET /learners : équivalent Sheets : lecture de l'onglet "Paiements". */
export async function fetchLearners(learners) {
  return simulateLatency(learners);
}

/**
 * POST /learners : ajoute un nouvel apprenant.
 * @param {Array} learners État actuel (le composant reste propriétaire du state).
 * @param {{name:string, cohort:string, option:'bloc'|'echelonne', initialPayment?:number, paymentMode?:string}} payload
 * @returns {Promise<Array>} La nouvelle liste (mise à jour immuable).
 */
export async function createLearner(learners, payload) {
  const total = payload.option === "bloc" ? 150000 : 180000;
  const initialPayment = payload.initialPayment ?? 0;
  const today = new Date().toISOString().slice(0, 10);

  const learner = {
    id: nextId(),
    name: payload.name,
    cohort: payload.cohort,
    option: payload.option,
    total,
    paid: initialPayment,
    nextDueDate: initialPayment > 0 ? nextMonthISO() : today,
    status: "a_jour",
    history: initialPayment > 0 ? [{ date: today, amount: initialPayment, mode: payload.paymentMode || "Espèces" }] : [],
  };
  learner.status = computeStatus(learner);

  return simulateLatency([learner, ...learners]);
}

/**
 * POST /learners/:id/payments : enregistre un versement et met à jour le
 * statut de l'apprenant. C'est la fonction que le stagiaire remplacera par
 * un `INSERT` dans la table `paiements` (option Supabase).
 */
export async function recordPayment(learners, learnerId, payment) {
  const updated = learners.map((l) => {
    if (l.id !== learnerId) return l;
    const paid = l.paid + payment.amount;
    const next = {
      ...l,
      paid,
      history: [...l.history, payment],
      nextDueDate: paid >= l.total ? null : l.nextDueDate,
    };
    next.status = computeStatus(next);
    return next;
  });
  return simulateLatency(updated);
}

function nextMonthISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

/**
 * Filtre les apprenants en retard selon le stade de relance (Playbook 3.3) :
 * J5 = entre 5 et 9 jours après l'échéance, J10 = 10 jours ou plus.
 * Fonction pure et synchrone : pas besoin d'attendre un réseau pour filtrer
 * des données déjà en mémoire.
 */
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

/** Construit le message de relance pré-rempli (Playbook 3.3) pour un apprenant. */
export function buildReminderMessage(learner, stage) {
  const firstName = learner.name.split(" ")[0];
  const month = MONTHS_FR[new Date().getMonth()];
  const amount = (learner.total - learner.paid).toLocaleString("fr-FR");
  return REMINDER_TEMPLATES[stage]({ firstName, month, amount });
}

/** Exporte les apprenants en CSV, prêt pour le rapport mensuel du Manager (15 du mois). */
export function learnersToCSV(learners) {
  const headers = ["ID", "Nom", "Cohorte", "Option", "Total", "Payé", "Restant", "Statut", "Prochaine échéance"];
  const rows = learners.map((l) => [
    l.id,
    l.name,
    l.cohort,
    l.option,
    l.total,
    l.paid,
    l.total - l.paid,
    l.status,
    l.nextDueDate ?? "",
  ]);
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

/** Déclenche le téléchargement d'un fichier texte (CSV) dans le navigateur. */
export function downloadTextFile(filename, content, mimeType = "text/csv;charset=utf-8;") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

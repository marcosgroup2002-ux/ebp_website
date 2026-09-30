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

import { supabase } from "../lib/supabaseClient";

/** Simule un appel réseau pour le fallback en mémoire. */
function simulateLatency(value, ms = 250) {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** GET /learners : lecture depuis Supabase avec fallback sur données mémoire. */
export async function fetchLearners(fallback = []) {
  if (!supabase) return simulateLatency(fallback);

  try {
    const { data, error } = await supabase
      .from("apprenants")
      .select(`
        id,
        nom,
        cohorte,
        option_paiement,
        total,
        statut,
        prochaine_echeance,
        paiements (
          id,
          montant,
          mode,
          date_paiement
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      if (error) console.info("[paymentsService] Supabase indisponible ou vide, fallback mémoire :", error.message);
      return simulateLatency(fallback);
    }

    return data.map((row) => {
      const history = (row.paiements || []).map((p) => ({
        id: p.id,
        amount: Number(p.montant),
        mode: p.mode,
        date: p.date_paiement,
      }));
      const paid = history.reduce((sum, p) => sum + p.amount, 0);
      return {
        id: row.id,
        name: row.nom,
        cohort: row.cohorte,
        option: row.option_paiement,
        total: Number(row.total),
        paid,
        nextDueDate: row.prochaine_echeance,
        status: row.statut,
        history,
      };
    });
  } catch (err) {
    console.warn("[paymentsService] Erreur Supabase, utilisation du fallback :", err);
    return simulateLatency(fallback);
  }
}

/**
 * POST /learners : ajoute un nouvel apprenant dans Supabase (ou mémoire).
 * @param {Array} learners État actuel (le composant reste propriétaire du state).
 * @param {{name:string, cohort:string, option:'bloc'|'echelonne', initialPayment?:number, paymentMode?:string}} payload
 * @returns {Promise<Array>} La nouvelle liste (mise à jour immuable).
 */
export async function createLearner(learners, payload) {
  const total = payload.option === "bloc" ? 150000 : 180000;
  const initialPayment = payload.initialPayment ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = initialPayment > 0 ? nextMonthISO() : today;

  if (supabase) {
    try {
      const { data: created, error } = await supabase
        .from("apprenants")
        .insert({
          nom: payload.name,
          cohorte: payload.cohort,
          option_paiement: payload.option,
          total,
          statut: initialPayment >= total ? "solde" : "a_jour",
          prochaine_echeance: initialPayment >= total ? null : nextDue,
        })
        .select()
        .single();

      if (!error && created) {
        let history = [];
        if (initialPayment > 0) {
          const { data: pData } = await supabase
            .from("paiements")
            .insert({
              apprenant_id: created.id,
              montant: initialPayment,
              mode: payload.paymentMode || "Espèces",
              date_paiement: today,
            })
            .select()
            .single();

          if (pData) {
            history.push({
              id: pData.id,
              date: pData.date_paiement,
              amount: Number(pData.montant),
              mode: pData.mode,
            });
          }
        }

        const newLearner = {
          id: created.id,
          name: created.nom,
          cohort: created.cohorte,
          option: created.option_paiement,
          total: Number(created.total),
          paid: initialPayment,
          nextDueDate: created.prochaine_echeance,
          status: created.statut,
          history,
        };
        return [newLearner, ...learners];
      }
    } catch (err) {
      console.warn("[paymentsService] Échec insertion Supabase, fallback mémoire :", err);
    }
  }

  // Fallback mémoire
  const learner = {
    id: nextId(),
    name: payload.name,
    cohort: payload.cohort,
    option: payload.option,
    total,
    paid: initialPayment,
    nextDueDate: nextDue,
    status: "a_jour",
    history: initialPayment > 0 ? [{ date: today, amount: initialPayment, mode: payload.paymentMode || "Espèces" }] : [],
  };
  learner.status = computeStatus(learner);

  return simulateLatency([learner, ...learners]);
}

/**
 * POST /learners/:id/payments : enregistre un versement et met à jour le statut.
 */
export async function recordPayment(learners, learnerId, payment) {
  if (supabase) {
    try {
      const { data: pData, error } = await supabase
        .from("paiements")
        .insert({
          apprenant_id: learnerId,
          montant: payment.amount,
          mode: payment.mode,
          date_paiement: payment.date,
        })
        .select()
        .single();

      if (!error && pData) {
        const target = learners.find((l) => l.id === learnerId);
        if (target) {
          const newPaid = target.paid + payment.amount;
          const newStatus = newPaid >= target.total ? "solde" : target.status;
          await supabase
            .from("apprenants")
            .update({
              statut: newStatus,
              prochaine_echeance: newPaid >= target.total ? null : target.nextDueDate,
            })
            .eq("id", learnerId);
        }
      }
    } catch (err) {
      console.warn("[paymentsService] Échec recordPayment Supabase, fallback mémoire :", err);
    }
  }

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

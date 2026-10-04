
import { supabase } from "../lib/supabaseClient";
import { REMINDER_TEMPLATES } from "../data/adminData";
import { logAuditEvent } from "./auditService";

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

const LOCAL_LEARNERS_KEY = "ebp_production_learners";

export function parseCohortAndCenter(rawCohort, rawCenter) {
  if (rawCenter && rawCohort) {
    return {
      cohorte: rawCohort.replace("Cohorte ", "").trim().split(" ")[0],
      centre: rawCenter,
    };
  }
  if (rawCohort && rawCohort.includes("·")) {
    const [cPart, centerPart] = rawCohort.split("·").map((s) => s.trim());
    return {
      cohorte: cPart.replace("Cohorte ", "").trim(),
      centre: centerPart,
    };
  }
  return {
    cohorte: rawCohort || "18.6",
    centre: rawCenter || "Calavi",
  };
}

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

export async function fetchLearners() {
  const localList = (() => {
    try {
      const stored = localStorage.getItem(LOCAL_LEARNERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  })();

  if (!supabase) return localList;

  try {
    const { data, error } = await supabase
      .from("apprenants")
      .select(`
        id,
        nom,
        centre,
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
      if (error) console.info("[paymentsService] Supabase indisponible ou vide :", error.message);
      return localList;
    }

    const loaded = data.map((row) => {
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
        centre: row.centre || "Calavi",
        cohort: `Cohorte ${row.cohorte} · ${row.centre || "Calavi"}`,
        rawCohort: row.cohorte,
        option: row.option_paiement,
        total: Number(row.total),
        paid,
        nextDueDate: row.prochaine_echeance,
        status: row.statut,
        history,
      };
    });

    try {
      localStorage.setItem(LOCAL_LEARNERS_KEY, JSON.stringify(loaded));
    } catch {

    }

    return loaded;
  } catch (err) {
    console.warn("[paymentsService] Erreur Supabase, lecture locale :", err);
    return localList;
  }
}

export async function createLearner(learners, payload, user) {
  const total = payload.option === "bloc" ? 150000 : 180000;
  const initialPayment = payload.initialPayment ?? 0;
  const today = new Date().toISOString().slice(0, 10);
  const nextDue = initialPayment >= total ? null : nextMonthISO();

  const { cohorte, centre } = parseCohortAndCenter(payload.cohort, payload.center);
  const cohortLabel = `Cohorte ${cohorte} · ${centre}`;

  let createdId = "L-" + Date.now();

  if (supabase) {
    try {
      const { data: created, error } = await supabase
        .from("apprenants")
        .insert({
          nom: payload.name.trim(),
          centre,
          cohorte,
          option_paiement: payload.option,
          total,
          statut: initialPayment >= total ? "solde" : "a_jour",
          prochaine_echeance: nextDue,
        })
        .select()
        .single();

      if (!error && created) {
        createdId = created.id;
        if (initialPayment > 0) {
          await supabase.from("paiements").insert({
            apprenant_id: created.id,
            montant: initialPayment,
            mode: payload.paymentMode || "Espèces",
            date_paiement: today,
            enregistre_par: user?.name || "Miss Amirath (Secrétaire)",
          });
        }
      }
    } catch (err) {
      console.warn("[paymentsService] Échec insertion Supabase, stockage local :", err);
    }
  }

  const history =
    initialPayment > 0
      ? [
          {
            id: "pay-" + Date.now(),
            date: today,
            amount: initialPayment,
            mode: payload.paymentMode || "Espèces",
          },
        ]
      : [];

  const newLearner = {
    id: createdId,
    name: payload.name.trim(),
    centre,
    cohort: cohortLabel,
    rawCohort: cohorte,
    option: payload.option,
    total,
    paid: initialPayment,
    nextDueDate: nextDue,
    status: initialPayment >= total ? "solde" : "a_jour",
    history,
  };

  const updated = [newLearner, ...learners];

  try {
    localStorage.setItem(LOCAL_LEARNERS_KEY, JSON.stringify(updated));
  } catch {

  }

  await logAuditEvent({
    action: "CREATION_APPRENANT",
    details: `Inscription de l'apprenant ${newLearner.name} dans la ${cohortLabel} (${payload.option === "bloc" ? "Bloc 150k" : "Échelonné 180k"}${initialPayment > 0 ? ` avec versement initial de ${initialPayment.toLocaleString("fr-FR")} F` : ""}).`,
    user,
  });

  return updated;
}

export async function recordPayment(learners, learnerId, payment, user) {
  const target = learners.find((l) => l.id === learnerId);
  const learnerName = target ? target.name : `Apprenant #${learnerId}`;

  if (supabase) {
    try {
      const { error } = await supabase.from("paiements").insert({
        apprenant_id: learnerId,
        montant: payment.amount,
        mode: payment.mode,
        date_paiement: payment.date,
        enregistre_par: user?.name || "Miss Amirath (Secrétaire)",
      });

      if (!error && target) {
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
    } catch (err) {
      console.warn("[paymentsService] Échec recordPayment Supabase :", err);
    }
  }

  const updated = learners.map((l) => {
    if (l.id !== learnerId) return l;
    const paid = l.paid + payment.amount;
    const next = {
      ...l,
      paid,
      history: [{ ...payment, id: "pay-" + Date.now() }, ...l.history],
      nextDueDate: paid >= l.total ? null : l.nextDueDate,
    };
    next.status = computeStatus(next);
    return next;
  });

  try {
    localStorage.setItem(LOCAL_LEARNERS_KEY, JSON.stringify(updated));
  } catch {

  }

  await logAuditEvent({
    action: "ENREGISTREMENT_PAIEMENT",
    details: `Versement de ${payment.amount.toLocaleString("fr-FR")} F (${payment.mode}) enregistré pour ${learnerName}.`,
    user,
  });

  return updated;
}

export async function deleteLearner(learners, learnerId, user) {
  const target = learners.find((l) => l.id === learnerId);
  const learnerName = target ? target.name : `Apprenant #${learnerId}`;

  if (supabase) {
    try {
      await supabase.from("apprenants").delete().eq("id", learnerId);
    } catch (err) {
      console.warn("[paymentsService] Échec suppression Supabase :", err);
    }
  }

  const updated = learners.filter((l) => l.id !== learnerId);
  try {
    localStorage.setItem(LOCAL_LEARNERS_KEY, JSON.stringify(updated));
  } catch {

  }

  await logAuditEvent({
    action: "SUPPRESSION_APPRENANT",
    details: `Suppression définitive du dossier de l'apprenant ${learnerName}.`,
    user,
  });

  return updated;
}

function nextMonthISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
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
  const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

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

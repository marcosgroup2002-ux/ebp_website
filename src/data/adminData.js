// ============================================================================
// CONSTANTES ET CONFIGURATION : Espace Admin EBP (Production)
// ============================================================================
// Toutes les données fictives (MOCK DATA) ont été purgées.
// Les données opérationnelles (Apprenants, Paiements, Audit Logs) proviennent
// directement de la base Supabase ou de la saisie réelle de production.

// Cohortes par défaut (extensible — les nouvelles cohortes sont ajoutées dynamiquement)
const DEFAULT_COHORTS = ["18.6", "18.7", "18.8"];
const COHORTS_STORAGE_KEY = "ebp_active_cohorts";

/**
 * Récupère la liste des cohortes actives (extensible, persistée en localStorage).
 */
export function getActiveCohorts() {
  try {
    const stored = JSON.parse(localStorage.getItem(COHORTS_STORAGE_KEY));
    if (Array.isArray(stored) && stored.length > 0) return stored;
  } catch {
    //
  }
  return DEFAULT_COHORTS;
}

/**
 * Ajoute une nouvelle cohorte à la liste active si elle n'existe pas déjà.
 */
export function addCohort(cohortNumber) {
  const current = getActiveCohorts();
  const trimmed = cohortNumber.trim();
  if (!trimmed || current.includes(trimmed)) return current;
  const updated = [...current, trimmed].sort();
  localStorage.setItem(COHORTS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

// Export pour compatibilité (lecture dynamique)
export const ACTIVE_COHORTS = getActiveCohorts();
export const ACTIVE_CENTERS = ["Calavi", "Cotonou"];

/**
 * Génère les options de cohorte combinées avec les centres (dynamique).
 */
export function getCohortOptions() {
  const cohorts = getActiveCohorts();
  const options = [];
  for (const co of cohorts) {
    for (const centre of ACTIVE_CENTERS) {
      options.push(`Cohorte ${co} · ${centre}`);
    }
  }
  return options;
}

export const COHORT_OPTIONS = getCohortOptions();

export const STATUS_LABELS = {
  a_jour: { label: "À jour", tone: "green" },
  en_retard: { label: "En retard", tone: "red" },
  suspendu: { label: "Suspendu", tone: "red" },
  solde: { label: "Soldé", tone: "blue" },
};

export const PAYMENT_MODES = ["Mobile Money", "Espèces", "Virement"];

// Checklist quotidienne secrétaire (Playbook 3.7)
export const SECRETARY_CHECKLIST = [
  "Vérifier les paiements Mobile Money reçus depuis la veille",
  "Mettre à jour le tableau de suivi des paiements",
  "Remettre les reçus en attente",
  "Répondre aux questions administratives des apprenants (délai max : 2h)",
  "Signaler au PDG tout retard critique dépassant le délai de grâce (J+10)",
];

// Dates clés du mois (Playbook 3.3, 3.7)
export const KEY_DATES = [
  { day: 1, label: "Annonce d'ouverture des tranches du mois" },
  { day: 5, label: "Première relance des impayés (J+5)" },
  { day: 10, label: "Relance finale + alerte PDG / suspension (J+10)" },
  { day: 15, label: "Rapport mensuel financier consolidé pour le PDG" },
  { day: 28, label: "Audit de clôture du mois et vérification des cohortes" },
];

// Modèles de relance (Playbook 3.3)
export const REMINDER_TEMPLATES = {
  J5: ({ firstName, month, amount }) =>
    `Bonjour ${firstName}, nous n'avons pas encore reçu votre règlement pour le mois de ${month}. Merci de régulariser votre situation avant le 10 ${month} pour continuer à suivre vos cours sans interruption. Montant dû : ${amount} F. Pour toute question : 0196840296`,
  J10: ({ firstName, month }) =>
    `Bonjour ${firstName}, c'est aujourd'hui le dernier jour du délai de grâce pour votre tranche de ${month}. Sans paiement reçu ce jour, votre accès aux cours sera suspendu à partir de demain, conformément au règlement intérieur d'EBP. Nous restons disponibles si vous rencontrez une difficulté particulière. 0196840296`,
};

export function formatFcfa(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "0 F";
  return `${amount.toLocaleString("fr-FR")} F`;
}

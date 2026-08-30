// ============================================================================
// DONNÉES DE DÉMONSTRATION : espace Admin EBP
// ============================================================================
// Ces données sont FICTIVES. Elles montrent la forme exacte que doivent
// prendre les modules Paiements et Checklists (Brief Stagiaire, Niveau 1),
// calquée sur les colonnes et procédures du Playbook Opérationnel.
//
// C'est la seule chose à remplacer pour brancher une vraie source de données
// (Google Sheets API, puis Supabase/Firebase) : voir src/services/ et
// docs/backend-integration.md pour le plan de bascule.

export const SAMPLE_LEARNERS = [
  {
    id: "L-001",
    name: "Kofi Assogba",
    cohort: "Cohorte 19 · Cotonou",
    option: "bloc",
    total: 150000,
    paid: 150000,
    nextDueDate: null,
    status: "solde",
    history: [
      { date: "2026-06-01", amount: 20000, mode: "Mobile Money" },
      { date: "2026-06-05", amount: 130000, mode: "Mobile Money" },
    ],
  },
  {
    id: "L-002",
    name: "Aïcha Boni",
    cohort: "Cohorte 19 · Cotonou",
    option: "echelonne",
    total: 180000,
    paid: 120000,
    nextDueDate: "2026-09-01",
    status: "a_jour",
    history: [
      { date: "2026-06-01", amount: 60000, mode: "Espèces" },
      { date: "2026-07-01", amount: 30000, mode: "Mobile Money" },
      { date: "2026-08-01", amount: 30000, mode: "Mobile Money" },
    ],
  },
  {
    id: "L-003",
    name: "Ulrich Dossou",
    cohort: "Cohorte 19 · Calavi",
    option: "echelonne",
    total: 180000,
    paid: 60000,
    nextDueDate: "2026-08-01",
    status: "en_retard",
    history: [{ date: "2026-07-01", amount: 60000, mode: "Mobile Money" }],
  },
  {
    id: "L-004",
    name: "Sandra Houénou",
    cohort: "Cohorte 19 · En ligne",
    option: "bloc",
    total: 150000,
    paid: 150000,
    nextDueDate: null,
    status: "solde",
    history: [{ date: "2026-06-03", amount: 150000, mode: "Virement" }],
  },
  {
    id: "L-005",
    name: "Rachidatou Alassane",
    cohort: "Cohorte 19 · Cotonou",
    option: "echelonne",
    total: 180000,
    paid: 60000,
    nextDueDate: "2026-08-01",
    status: "suspendu",
    history: [{ date: "2026-06-01", amount: 60000, mode: "Espèces" }],
  },
  {
    id: "L-006",
    name: "Marius Tchibozo",
    cohort: "Cohorte 19 · Calavi",
    option: "echelonne",
    total: 180000,
    paid: 150000,
    nextDueDate: "2026-09-01",
    status: "a_jour",
    history: [
      { date: "2026-06-01", amount: 60000, mode: "Espèces" },
      { date: "2026-07-01", amount: 30000, mode: "Mobile Money" },
      { date: "2026-08-01", amount: 30000, mode: "Mobile Money" },
      { date: "2026-09-01", amount: 30000, mode: "Mobile Money" },
    ],
  },
];

export const STATUS_LABELS = {
  a_jour: { label: "À jour", tone: "green" },
  en_retard: { label: "En retard", tone: "red" },
  suspendu: { label: "Suspendu", tone: "red" },
  solde: { label: "Soldé", tone: "blue" },
};

export const PAYMENT_MODES = ["Mobile Money", "Espèces", "Virement"];

// Utilisateurs de démonstration, pour simuler "qui a coché quoi et quand"
// sans vraie authentification. À remplacer par de vrais comptes lors du
// branchement du module Utilisateurs (voir docs/backend-integration.md).
export const SAMPLE_USERS = [
  { id: "U-1", name: "Prisca Agossou", role: "Secrétaire" },
  { id: "U-2", name: "Kevin Hounsou", role: "Formateur" },
  { id: "U-3", name: "Fernande Dagba", role: "Manager" },
  { id: "U-4", name: "Fernando Sessou", role: "Promoteur" },
];

// Checklist quotidienne secrétaire (Playbook 3.7)
export const SECRETARY_CHECKLIST = [
  "Vérifier les paiements Mobile Money reçus depuis la veille",
  "Mettre à jour le tableau de suivi des paiements",
  "Remettre les reçus en attente",
  "Répondre aux questions administratives des apprenants (délai max : 2h)",
];

// Checklist formateur avant / après séance (Playbook 5.7)
export const TRAINER_CHECKLIST_BEFORE = [
  "Préparer le plan de séance (notion, exemples, activités)",
  "Préparer le pretest et le posttest",
  "Vérifier les supports (audio, vidéo, fiches)",
  "Mettre à jour le tableau de présences de la séance précédente",
];

export const TRAINER_CHECKLIST_AFTER = [
  "Noter les scores pretest et posttest dans le tableau de suivi",
  "Signaler au Manager tout apprenant en difficulté deux semaines de suite",
  "Préparer le contenu de la prochaine séance",
];

// Marque l'item qui doit déclencher une alerte Manager au clic (voir
// ChecklistsView : icône de signalement à côté de cet item précis).
export const FLAGGABLE_ITEM = "Signaler au Manager tout apprenant en difficulté deux semaines de suite";

// Checklist Onboarding (Playbook 7.2) : à cocher pour chaque nouvel apprenant.
export const ONBOARDING_CHECKLIST = [
  "Message de remerciement envoyé (dans l'heure)",
  "Lien du formulaire d'informations générales envoyé",
  "Apprenant ajouté au groupe WhatsApp de la cohorte",
  "Séquence de messages J-8 à J-1 programmée",
  "Apprenant ajouté au tableau de suivi Early Warning",
  "Welcome Session effectuée",
  "Contrat et règlement intérieur signés",
  "Test de niveau passé",
  "Paiement à jour",
];

// Dates clés du mois (Playbook 3.3, 3.7, 5.4) : utilisées par le bandeau de
// rappels du module Checklists.
export const KEY_DATES = [
  { day: 1, label: "Annonce d'ouverture des tranches du mois" },
  { day: 5, label: "Première relance des impayés" },
  { day: 10, label: "Relance finale + alerte Manager" },
  { day: 15, label: "Rapport mensuel envoyé au Manager" },
  { day: 28, label: "Formulaire mensuel de suivi apprenant" },
];

// Modèles de relance (Playbook 3.3), remplis dynamiquement par
// buildReminderMessage() dans services/paymentsService.js.
export const REMINDER_TEMPLATES = {
  J5: ({ firstName, month, amount }) =>
    `Bonjour ${firstName}, nous n'avons pas encore reçu votre règlement pour le mois de ${month}. Merci de régulariser votre situation avant le 10 ${month} pour continuer à suivre vos cours sans interruption. Montant dû : ${amount} F. Pour toute question : 0196840296`,
  J10: ({ firstName, month }) =>
    `Bonjour ${firstName}, c'est aujourd'hui le dernier jour du délai de grâce pour votre tranche de ${month}. Sans paiement reçu ce jour, votre accès aux cours sera suspendu à partir de demain, conformément au règlement intérieur d'EBP. Nous restons disponibles si vous rencontrez une difficulté particulière. 0196840296`,
};

export function formatFcfa(amount) {
  return `${amount.toLocaleString("fr-FR")} F`;
}

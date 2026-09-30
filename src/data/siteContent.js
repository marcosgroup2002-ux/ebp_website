// ============================================================================
// CONTENU DU SITE EBP : fichier centralisé
// Modifie les valeurs ici plutôt que dans les composants (date de rentrée,
// numéro WhatsApp, tarifs, etc.)
// ============================================================================

// ⚠️ Numéro au format international pour les liens wa.me (sans "+", sans espace)
// 0196840296 -> format Bénin post-2021 (préfixe 01 inclus) -> +229 0196840296
export const WHATSAPP_NUMBER = "2290196840296";
export const WHATSAPP_DISPLAY = "01 96 84 02 96";

// TODO: remplacer par le vrai domaine de prod une fois le nom de domaine
// définitif choisi et déployé. Sert de base aux URLs canoniques et og:url.
export const SITE_URL = "https://ebp-benin.com";
export const SITE_NAME = "EBP - English for Busy People";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/brand/ebp-logo.jpg`;

// TODO: mettre à jour à chaque nouvelle cohorte
export const NEXT_COHORT_DATE = "6 Octobre 2026";
export const SEATS_LEFT = 7;

export const NAV_LINKS = [
  { label: "Programme (6 Mois)", href: "#programme" },
  { label: "Formats", href: "#formats" },
  { label: "Tarifs & Paiements", href: "#tarifs" },
  { label: "Témoignages & Graduation", href: "#temoignages" },
];

export const CENTERS = [
  {
    icon: "MapPin",
    title: "Centre Cotonou",
    detail: "Quartier Vedoko",
  },
  {
    icon: "MapPin",
    title: "Centre Calavi",
    detail: "Quartier Bidossessi",
  },
  {
    icon: "Monitor",
    title: "En Ligne",
    detail: "Classes virtuelles interactives via Google Meet",
  },
  {
    icon: "Clock",
    title: "Horaires Flexibles",
    detail: "Sessions du Matin & du Soir",
  },
];

export const PILLARS = [
  {
    icon: "Zap",
    tag: "Closing Experience",
    title: "Closing & Qualification Flash",
    description:
      "Prise en charge en 5 minutes. Choix de l'objectif (Voyage, Pro, Académique) pour un parcours sur mesure.",
    highlighted: false,
  },
  {
    icon: "ClipboardCheck",
    tag: "Digital Transaction",
    title: "Onboarding & Évaluations",
    description:
      "Test de niveau préalable, signature du contrat et du règlement intérieur, suivi hebdomadaire Pretest / Posttest.",
    highlighted: true,
  },
  {
    icon: "Users",
    tag: "Dedicated Team",
    title: "Équipe & Mentors Dédiés",
    description:
      "Formateurs certifiés, coach du mois, relances personnalisées (Early Warning System) en cas de difficulté.",
    highlighted: false,
  },
  {
    icon: "Award",
    tag: "Certification & Capstone",
    title: "Certification & Capstone",
    description:
      "Attestation officielle délivrée après présentation du projet Capstone du Mois 6 devant un jury.",
    highlighted: false,
  },
];

export const PROGRAM_MONTHS = [
  {
    month: "Mois 1",
    title: "Foundations of Spoken English",
    description:
      "Auto-présentation, sons fondamentaux de l'anglais, routines du quotidien pour démarrer à l'oral dès la première semaine.",
  },
  {
    month: "Mois 2",
    title: "Accuracy, Fluency & Real-Life Communication",
    description:
      "Grammaire complète revisitée par la pratique, storytelling et mises en situation réelles.",
  },
  {
    month: "Mois 3",
    title: "Advanced Grammar & Professional Confidence",
    description:
      "Simulation d'entretien d'embauche et entraînement à l'écoute avancée pour gagner en aisance professionnelle.",
  },
  {
    month: "Mois 4",
    title: "Real-Life Fluency & Emotional Intelligence",
    description:
      "Négociation, gestion des émotions à l'oral, vocabulaire de l'hôtellerie et du service client.",
  },
  {
    month: "Mois 5",
    title: "Argumentation & Professional Themes",
    description:
      "Débats finaux et défense de positions complexes sur des sujets professionnels.",
  },
  {
    month: "Mois 6",
    title: "Presentation Mastery & Speaking Impact",
    description:
      "Préparation intensive et soutenance du Capstone Final devant un jury EBP.",
  },
];

export const COVERAGE_HUBS = [
  { name: "Cotonou", x: 46, y: 58, primary: true },
  { name: "Calavi", x: 41, y: 55, primary: true },
  { name: "Lomé", x: 34, y: 60 },
  { name: "Abidjan", x: 20, y: 58 },
  { name: "Dakar", x: 8, y: 44 },
  { name: "Paris", x: 40, y: 14 },
  { name: "Montréal", x: 8, y: 12 },
];

export const TEAM_POINTS = [
  "Formateurs certifiés, sélectionnés pour leur maîtrise de l'oral et leur pédagogie",
  "Coach du mois dédié au suivi individuel de chaque apprenant",
  "Early Warning System : relance personnalisée dès le premier signe de difficulté",
];

export const PRICING_OPTIONS = [
  {
    id: "echelonne",
    label: "Paiement Échelonné",
    price: "180 000",
    unit: "FCFA au total",
    highlight: false,
    conditions: "60 000 FCFA à l'inscription, puis tranches mensuelles",
    advantage: "Accessibilité maximale, étalé sur 6 mois",
    cta: "Réserver avec 20 000 F d'acompte",
  },
  {
    id: "bloc",
    label: "Paiement en Bloc",
    price: "150 000",
    unit: "FCFA en une fois",
    highlight: true,
    badge: "Économisez 30 000 FCFA",
    conditions: "150 000 FCFA réglés en une seule fois",
    advantage: "Remise immédiate (150k au lieu de 180k), kit pédagogique inclus",
    cta: "Profiter de l'offre Bloc",
  },
];

export const FEES = [
  { label: "Inscription", value: "20 000 F", note: "déduits du montant total" },
  {
    label: "Documents pédagogiques",
    value: "15 000 F",
    note: "Kit complet : Book, Workbook, Audio/Vidéo",
  },
];

// --------------------------------------------------------------------------
// À PROPOS : contenu tiré du Playbook Opérationnel EBP (parties publiques :
// philosophie, culture, méthode). Les procédures internes (RH, finance,
// tags WhatsApp...) restent dans l'espace admin, pas sur le site public.
// --------------------------------------------------------------------------

export const FOUNDER_NAME = "Fernando SESSOU";

export const PHILOSOPHY_QUOTE =
  "We do not teach English. We train people to speak English.";

export const PHILOSOPHY_TEXT =
  "La différence est simple : à chaque séance, c'est l'apprenant qui parle, pratique et agit, pas seulement le formateur. Un cours EBP silencieux n'est pas un cours EBP.";

export const CREED_PRINCIPLES = [
  "L'éducation transforme des vies.",
  "L'excellence pédagogique est notre engagement absolu.",
  "Nous brisons les barrières de temps et d'espace pour l'apprentissage.",
  "L'innovation guide notre pédagogie.",
  "Nos partenariats créent des opportunités professionnelles.",
  "Nous avons un impact social en facilitant l'accès à l'éducation.",
  "L'apprenant est notre priorité absolue.",
  "Intégrité, transparence et éthique guident nos actions.",
  "Nous sommes une communauté dédiée à la formation continue et à l'amélioration.",
];

export const CULTURE_VALUES = [
  {
    title: "Engagement envers l'apprenant",
    description: "La réussite de l'apprenant passe avant tout. On prépare, on s'adapte, on suit.",
  },
  {
    title: "Excellence pédagogique",
    description: "Chaque séance est préparée. On ne vient jamais en cours sans plan.",
  },
  {
    title: "Accessibilité",
    description: "On s'adapte aux niveaux, aux horaires, aux contextes. Pas d'élitisme.",
  },
  {
    title: "Intégrité",
    description: "Honnêteté avec les apprenants, transparence avec la direction. Toujours.",
  },
];

// Déroulé standard d'une séance EBP (Playbook 5.3) : 7 étapes, 60% du temps
// de parole pour l'apprenant.
export const SESSION_STEPS = [
  { title: "Notion du jour", duration: "20 min", description: "Objectifs clairs, exemples concrets, contexte réel." },
  { title: "Pretest", duration: "10 min", description: "Mesure du niveau de départ, sans correction immédiate." },
  { title: "Cours principal", duration: "40–50 min", description: "Approfondissement de la notion, maximum 40% de temps de parole formateur." },
  { title: "Pratique guidée", duration: "30 min", description: "Exercices en duo, trio ou groupe, corrections à chaud." },
  { title: "Audio de la semaine", duration: "15 min", description: "Écoute authentique : identification, transcription, reformulation." },
  { title: "English Corner", duration: "20–25 min", description: "Mise en situation libre : jeu de rôle, débat, storytelling." },
  { title: "Posttest & Wrap-up", duration: "10 min", description: "Mesure de la progression et annonce du prochain cours." },
];

export const EVALUATION_LEVELS = [
  { label: "Excellent", range: "85% et plus", description: "Maîtrise complète, prêt pour le niveau suivant." },
  { label: "Acquis", range: "65% à 84%", description: "Bonne progression, quelques points à consolider." },
  { label: "En cours", range: "45% à 64%", description: "Progression visible, soutien individuel recommandé." },
  { label: "À retravailler", range: "moins de 45%", description: "Plan de rattrapage individualisé mis en place." },
];

export const CONTACT_INFO = {
  centers: [
    {
      name: "Centre Cotonou",
      address: "Quartier Vedoko, Cotonou",
      hours: "Lun–Sam · sessions du matin & du soir",
    },
    {
      name: "Centre Calavi",
      address: "Quartier Bidossessi, Calavi",
      hours: "Lun–Sam · sessions du matin & du soir",
    },
    {
      name: "En ligne",
      address: "Classes interactives via Google Meet",
      hours: "Depuis toute la sous-région et la diaspora",
    },
  ],
  email: "contact@ebp-benin.com",
};

export const TESTIMONIALS = [
  {
    name: "Rachidatou A.",
    role: "Chargée de clientèle, Cotonou",
    quote:
      "Je gère aujourd'hui des appels internationaux sans stress. La méthode 60% pratique change vraiment la donne.",
    cohort: "Promotion Janvier 2026",
  },
  {
    name: "Ulrich K.",
    role: "Entrepreneur, Calavi",
    quote:
      "Le suivi hebdomadaire et le coach du mois m'ont poussé à ne jamais lâcher, même avec un emploi du temps chargé.",
    cohort: "Promotion Mars 2026",
  },
  {
    name: "Sandra D.",
    role: "Étudiante en ligne, diaspora France",
    quote:
      "Les sessions du soir sur Google Meet m'ont permis de suivre le programme depuis Paris sans rien perdre de la pratique orale.",
    cohort: "Promotion En Ligne 2026",
  },
];

// ============================================================================
// MÉDIATHÈQUE EBP : photos réelles du centre & vidéo d'accueil
// ============================================================================
// Les photos réelles de l'équipe, des coachs, des salles de formation et du PDG
// proviennent du dossier ebp-photo (servies depuis /photos/...).
// La vidéo Hero et la toute première photo de transition sont conservées intactes
// selon les règles strictes d'inviolabilité du projet.

const unsplashBase = (id) => `https://images.unsplash.com/${id}`;

export function img(id, { w = 1200, q = 75 } = {}) {
  if (!id) return "";
  // Si c'est un chemin local ou une URL externe complète, on la retourne directement
  if (id.startsWith("/") || id.startsWith("http://") || id.startsWith("https://")) {
    return id;
  }
  return `${unsplashBase(id)}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export const MEDIA = {
  hero: {
    slides: [
      // 1ère image (RÈGLE D'INVIOLABILITÉ : conservée intacte)
      "photo-1637856794303-d864ce316444", // révisions en duo, laptop
      // Photos réelles EBP ajoutées dans le même design
      "/photos/classroom-session.jpeg", // cours interactif avec apprenants et formateur EBP
      "/photos/team-all.jpeg", // équipe EBP et PDG réunis
      "/photos/team-meeting.jpeg", // équipe pédagogique EBP autour du PDG
    ],
    video: {
      // RÈGLE D'INVIOLABILITÉ : vidéo conservée intacte
      mp4: "https://videos.pexels.com/video-files/8123989/8123989-hd_1080_1920_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/8123989/age-aging-aging-active-aging-positive-8123989.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  },
  about: {
    portrait1: "/photos/pdg.jpeg", // Photo officielle du PDG (Fondateur Fernando Sessou)
    portrait2: "/photos/pdg-desk.jpeg", // PDG au bureau EBP
    team: "/photos/team-all.jpeg", // Équipe complète EBP
  },
  method: {
    group: "/photos/classroom-session.jpeg", // Séance de pratique en groupe
    banner: "/photos/classroom-whiteboard.jpeg", // Enseignement au tableau blanc
  },
  team: {
    coaching1: "/photos/team-coaches.jpeg", // Équipe des coachs EBP en uniforme
    coaching2: "/photos/coach-portrait.jpeg", // Coach EBP individuel
    meeting: "/photos/team-meeting.jpeg", // Réunion de travail
  },
  coverage: {
    banner: "/photos/classroom-group.jpeg", // Classe active avec support visuel
  },
  formats: {
    banner: "/photos/team-meeting.jpeg",
  },
  testimonials: {
    rachidatou: "photo-1616901987621-9267100a6c5f",
    ulrich: "photo-1508243529287-e21914733111",
    sandra: "photo-1628551019295-99fc72f7fc66",
  },
  blog: {
    "parler-anglais-confiance": "/photos/classroom-group.jpeg",
    "reussir-entretien-embauche-anglais": "/photos/team-meeting.jpeg",
    "anglais-voyage-opportunites": "/photos/team-banner.jpeg",
    "apprendre-en-ligne-efficacement": "/photos/classroom-session.jpeg",
  },
  contact: {
    banner: "/photos/team-banner.jpeg", // Photo officielle équipe EBP devant le banner
  },
};

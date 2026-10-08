const unsplashBase = (id) => `https://images.unsplash.com/${id}`;

// Dossiers compressés par scripts/optimize-images.mjs : chaque photo existe aussi en « -960 ».
const OPTIMIZED_FOLDERS = ["/photos/", "/graduation/", "/pillars/"];
const SMALL_WIDTH = 960;

function isOptimizedLocal(path) {
  return OPTIMIZED_FOLDERS.some((folder) => path.startsWith(folder));
}

function smallVariant(path) {
  return path.replace(/(.jpe?g)$/i, `-${SMALL_WIDTH}$1`);
}

export function img(id, { w = 1200, q = 75 } = {}) {
  if (!id) return "";

  if (id.startsWith("/")) {
    return isOptimizedLocal(id) && w <= SMALL_WIDTH ? smallVariant(id) : id;
  }
  if (id.startsWith("http://") || id.startsWith("https://")) {
    return id;
  }
  return `${unsplashBase(id)}?auto=format&fit=crop&w=${w}&q=${q}`;
}

// Laisse le navigateur choisir la taille adaptée à l'écran (mobile : version légère).
export function imgSrcSet(id, { q = 70 } = {}) {
  if (!id) return undefined;
  if (id.startsWith("/")) {
    return isOptimizedLocal(id) ? `${smallVariant(id)} ${SMALL_WIDTH}w, ${id} 1920w` : undefined;
  }
  if (id.startsWith("http")) return undefined;
  return [640, 1280, 1920].map((w) => `${img(id, { w, q })} ${w}w`).join(", ");
}

export const MEDIA = {
  hero: {
    slides: [
      "/photos/classroom-session.jpeg",
      "/photos/team-all.jpeg",
      "/photos/classroom-group.jpeg",
      "/photos/classroom-whiteboard.jpeg",
      "/photos/team-meeting.jpeg",
    ],
    video: {

      // Rendus plus légers que le 1080p d'origine (5,9 Mo) : 1,7 Mo sur mobile, 2,9 Mo sur ordinateur.
      mp4Mobile: "https://videos.pexels.com/video-files/8123989/8123989-sd_540_960_30fps.mp4",
      mp4: "https://videos.pexels.com/video-files/8123989/8123989-hd_720_1280_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/8123989/age-aging-aging-active-aging-positive-8123989.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  },
  about: {
    portrait1: "/photos/pdg.jpeg", 
    portrait2: "/photos/pdg-desk.jpeg", 
    team: "/photos/team-all.jpeg", 
  },
  method: {
    group: "/photos/classroom-session.jpeg", 
    banner: "/photos/classroom-whiteboard.jpeg", 
  },
  team: {
    coaching1: "/photos/team-coaches.jpeg", 
    coaching2: "/photos/coach-portrait.jpeg", 
    meeting: "/photos/team-meeting.jpeg", 
  },
  coverage: {
    banner: "/photos/classroom-group.jpeg", 
  },
  formats: {
    banner: "/photos/team-meeting.jpeg",
  },
  pillars: {
    Zap: "/pillars/closing-accueil.jpg",
    ClipboardCheck: "/pillars/onboarding-evaluation.jpg",
    Users: "/pillars/equipe-mentors.jpg",
    Award: "/pillars/certification-attestation.jpg",
  },
  blog: {
    "parler-anglais-confiance": "/photos/classroom-group.jpeg",
    "reussir-entretien-embauche-anglais": "/photos/team-meeting.jpeg",
    "anglais-voyage-opportunites": "/photos/team-banner.jpeg",
    "apprendre-en-ligne-efficacement": "/photos/classroom-session.jpeg",
  },
  contact: {
    banner: "/photos/team-banner.jpeg", 
  },
};

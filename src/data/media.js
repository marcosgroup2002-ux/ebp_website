
const unsplashBase = (id) => `https://images.unsplash.com/${id}`;

export function img(id, { w = 1200, q = 75 } = {}) {
  if (!id) return "";

  if (id.startsWith("/") || id.startsWith("http://") || id.startsWith("https://")) {
    return id;
  }
  return `${unsplashBase(id)}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export const MEDIA = {
  hero: {
    slides: [

      "photo-1637856794303-d864ce316444", 

      "/photos/classroom-session.jpeg", 
      "/photos/team-all.jpeg", 
      "/photos/team-meeting.jpeg", 
    ],
    video: {

      mp4: "https://videos.pexels.com/video-files/8123989/8123989-hd_1080_1920_30fps.mp4",
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
    banner: "/photos/team-banner.jpeg", 
  },
};

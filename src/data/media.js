// ============================================================================
// MÉDIATHÈQUE EBP : photos & vidéo réelles, sous licence libre
// ============================================================================
// Toutes les images proviennent d'Unsplash (Unsplash License, usage commercial
// libre, sans attribution obligatoire) et la vidéo de Pexels (Pexels License,
// même principe). Aucune image "Unsplash+" (payante) n'est utilisée.
//
// Le helper `img()` s'appuie sur le CDN imgix d'Unsplash pour ne charger que le
// poids nécessaire à chaque contexte (largeur + qualité ajustables), afin de
// rester "premium mais léger" comme demandé.
//
// À REMPLACER progressivement par de vraies photos EBP (élèves, formateurs,
// centres de Cotonou/Calavi) dès qu'elles seront disponibles (voir README).

const unsplashBase = (id) => `https://images.unsplash.com/${id}`;

export function img(id, { w = 1200, q = 75 } = {}) {
  return `${unsplashBase(id)}?auto=format&fit=crop&w=${w}&q=${q}`;
}

export const MEDIA = {
  hero: {
    slides: [
      "photo-1637856794303-d864ce316444", // révisions en duo, laptop
      "photo-1758270705518-b61b40527e76", // classe en ligne, visioconférence
      "photo-1543807535-eceef0bc6599", // trois amis qui rient, énergie de groupe
    ],
    video: {
      mp4: "https://videos.pexels.com/video-files/8123989/8123989-hd_1080_1920_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/8123989/age-aging-aging-active-aging-positive-8123989.jpeg?auto=compress&cs=tinysrgb&w=1200",
    },
  },
  about: {
    portrait1: "photo-1611432579402-7037e3e2c1e4", // femme souriante, tablette
    portrait2: "photo-1563132337-f159f484226c", // femme, blazer orange
    team: "photo-1543807535-eceef0bc6599",
  },
  method: {
    group: "photo-1573497701240-345a300b8d36", // 5 personnes, discussion de groupe
  },
  team: {
    coaching1: "photo-1573497491208-6b1acb260507", // deux femmes, échange
    coaching2: "photo-1573496267526-08a69e46a409",
  },
  testimonials: {
    rachidatou: "photo-1616901987621-9267100a6c5f",
    ulrich: "photo-1508243529287-e21914733111",
    sandra: "photo-1628551019295-99fc72f7fc66",
  },
  blog: {
    "parler-anglais-confiance": "photo-1573497019418-b400bb3ab074",
    "reussir-entretien-embauche-anglais": "photo-1666867540898-aaa1993ffabc",
    "anglais-voyage-opportunites": "photo-1612534574950-b349c9f5781f",
    "apprendre-en-ligne-efficacement": "photo-1653669486397-b802144ae64a",
  },
  contact: {
    banner: "photo-1655720357740-bdf90f34483f",
  },
};

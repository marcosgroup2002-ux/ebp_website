
import { supabase } from "../lib/supabaseClient";
import { logAuditEvent } from "./auditService";

export const COACH_PROFILES = [
  { id: "c-calavi-1", name: "Coach Calavi 1 · Oral Fluency", centre: "Calavi", speciality: "Fluency & Conversation" },
  { id: "c-calavi-2", name: "Coach Calavi 2 · Business English", centre: "Calavi", speciality: "Pitching & Negotiation" },
  { id: "c-calavi-3", name: "Coach Calavi 3 · Grammar & Syntax", centre: "Calavi", speciality: "Structures & Writing" },
  { id: "c-calavi-4", name: "Coach Calavi 4 · Phonetics & Accent", centre: "Calavi", speciality: "Accent Reduction Immersion" },
  { id: "c-cotonou-1", name: "Coach Cotonou 1 · Executive Speaking", centre: "Cotonou", speciality: "Boardroom & Debate" },
  { id: "c-cotonou-2", name: "Coach Cotonou 2 · Professional Writing", centre: "Cotonou", speciality: "Contracts & Correspondence" },
];

const DEFAULT_SCHEDULES = [

  {
    id: "sch-1",
    coach_name: "Coach Calavi 1 · Oral Fluency",
    centre: "Calavi",
    cohorte: "18.6",
    jour: "Lundi",
    heure_debut: "18h30",
    heure_fin: "20h30",
    matiere: "Fluency & Spoken English Bootcamp",
    salle: "Salle A (Calavi)",
  },
  {
    id: "sch-2",
    coach_name: "Coach Calavi 1 · Oral Fluency",
    centre: "Calavi",
    cohorte: "18.7",
    jour: "Mercredi",
    heure_debut: "18h30",
    heure_fin: "20h30",
    matiere: "Fluency & Spoken English Bootcamp",
    salle: "Salle A (Calavi)",
  },
  {
    id: "sch-3",
    coach_name: "Coach Calavi 2 · Business English",
    centre: "Calavi",
    cohorte: "18.6",
    jour: "Mardi",
    heure_debut: "18h30",
    heure_fin: "20h30",
    matiere: "Business Pitching & Negotiation",
    salle: "Salle B (Calavi)",
  },
  {
    id: "sch-4",
    coach_name: "Coach Calavi 2 · Business English",
    centre: "Calavi",
    cohorte: "18.8",
    jour: "Jeudi",
    heure_debut: "18h30",
    heure_fin: "20h30",
    matiere: "Professional Communication",
    salle: "Salle B (Calavi)",
  },
  {
    id: "sch-5",
    coach_name: "Coach Calavi 3 · Grammar & Syntax",
    centre: "Calavi",
    cohorte: "18.7",
    jour: "Mardi",
    heure_debut: "18h30",
    heure_fin: "20h30",
    matiere: "Mastering English Structures & Syntax",
    salle: "Salle C (Calavi)",
  },
  {
    id: "sch-6",
    coach_name: "Coach Calavi 3 · Grammar & Syntax",
    centre: "Calavi",
    cohorte: "18.8",
    jour: "Vendredi",
    heure_debut: "18h30",
    heure_fin: "20h30",
    matiere: "Syntax & Idiomatic Expressions",
    salle: "Salle C (Calavi)",
  },
  {
    id: "sch-7",
    coach_name: "Coach Calavi 4 · Phonetics & Accent",
    centre: "Calavi",
    cohorte: "18.6",
    jour: "Samedi",
    heure_debut: "09h00",
    heure_fin: "12h00",
    matiere: "Phonetics & Accent Reduction Immersion",
    salle: "Salle A (Calavi)",
  },
  {
    id: "sch-8",
    coach_name: "Coach Calavi 4 · Phonetics & Accent",
    centre: "Calavi",
    cohorte: "18.8",
    jour: "Samedi",
    heure_debut: "14h00",
    heure_fin: "17h00",
    matiere: "Phonetics & Accent Reduction Immersion",
    salle: "Salle B (Calavi)",
  },

  {
    id: "sch-9",
    coach_name: "Coach Cotonou 1 · Executive Speaking",
    centre: "Cotonou",
    cohorte: "18.6",
    jour: "Lundi",
    heure_debut: "19h00",
    heure_fin: "21h00",
    matiere: "Executive Speaking & Boardroom Debates",
    salle: "Salle VIP Vedoko",
  },
  {
    id: "sch-10",
    coach_name: "Coach Cotonou 1 · Executive Speaking",
    centre: "Cotonou",
    cohorte: "18.7",
    jour: "Jeudi",
    heure_debut: "19h00",
    heure_fin: "21h00",
    matiere: "Executive Presentations & Closing",
    salle: "Salle VIP Vedoko",
  },
  {
    id: "sch-11",
    coach_name: "Coach Cotonou 2 · Professional Writing",
    centre: "Cotonou",
    cohorte: "18.7",
    jour: "Mardi",
    heure_debut: "19h00",
    heure_fin: "21h00",
    matiere: "High-Impact Writing & Negotiations",
    salle: "Salle Vedoko 2",
  },
  {
    id: "sch-12",
    coach_name: "Coach Cotonou 2 · Professional Writing",
    centre: "Cotonou",
    cohorte: "18.8",
    jour: "Vendredi",
    heure_debut: "19h00",
    heure_fin: "21h00",
    matiere: "Professional Correspondence & Contracts",
    salle: "Salle Vedoko 2",
  },
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "ann-1",
    titre: "Consignes Pédagogiques · Cohortes Actives 18.6, 18.7 et 18.8",
    contenu:
      "Chers coachs de Calavi et Cotonou, veillez à appliquer rigoureusement le pretest et posttest sur chaque module. Aucune session de retard ne sera tolérée sans accord préalable. Les feuilles de présence doivent être clôturées immédiatement après la séance.",
    auteur: "Mr Sessou Fernando (PDG)",
    priorite: "urgente",
    created_at: new Date().toISOString(),
  },
  {
    id: "ann-2",
    titre: "Rappel sur les fiches de suivi de fin de séance",
    contenu:
      "Tout apprenant ayant manqué deux séances consécutives doit être mentionné sans délai dans le rapport afin que le secrétariat puisse opérer la relance d'assiduité.",
    auteur: "Mr Sessou Fernando (PDG)",
    priorite: "normale",
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const SCHEDULES_KEY = "ebp_coach_schedules";
const ANNOUNCEMENTS_KEY = "ebp_announcements";

export async function fetchCoachSchedules() {
  const local = (() => {
    try {
      const stored = localStorage.getItem(SCHEDULES_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SCHEDULES;
    } catch {
      return DEFAULT_SCHEDULES;
    }
  })();

  if (!supabase) return local;

  try {
    const { data, error } = await supabase.from("coach_schedules").select("*").order("jour");
    if (error || !data || data.length === 0) return local;
    return data;
  } catch {
    return local;
  }
}

export async function fetchAnnouncements() {
  const local = (() => {
    try {
      const stored = localStorage.getItem(ANNOUNCEMENTS_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_ANNOUNCEMENTS;
    } catch {
      return DEFAULT_ANNOUNCEMENTS;
    }
  })();

  if (!supabase) return local;

  try {
    const { data, error } = await supabase.from("annonces").select("*").order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return local;
    return data;
  } catch {
    return local;
  }
}

export async function createAnnouncement({ titre, contenu, priorite = "normale", user }) {
  const newAnn = {
    id: "ann-" + Date.now(),
    titre,
    contenu,
    auteur: user?.name || "Mr Sessou Fernando (PDG)",
    priorite,
    created_at: new Date().toISOString(),
  };

  try {
    const current = await fetchAnnouncements();
    localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([newAnn, ...current]));
  } catch {

  }

  if (supabase) {
    try {
      await supabase.from("annonces").insert({
        titre,
        contenu,
        auteur: newAnn.auteur,
        priorite,
      });
    } catch (err) {
      console.warn("[coachService] Erreur insertion annonce Supabase :", err);
    }
  }

  await logAuditEvent({
    action: "PUBLICATION_ANNONCE",
    details: `Nouvelle consigne publiée aux coachs : "${titre}" (Priorité: ${priorite})`,
    user,
  });

  return newAnn;
}

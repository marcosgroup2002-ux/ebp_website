import { requireSupabase, toUserMessage } from "../lib/supabaseClient";

const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export async function fetchCoachSchedules() {
  const { data, error } = await requireSupabase().from("coach_schedules").select("*");
  if (error) throw new Error(toUserMessage(error, "Impossible de charger l'emploi du temps."));
  return data.sort(
    (a, b) => WEEKDAYS.indexOf(a.jour) - WEEKDAYS.indexOf(b.jour) || a.heure_debut.localeCompare(b.heure_debut)
  );
}

export async function fetchAnnouncements() {
  const { data, error } = await requireSupabase()
    .from("annonces")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(toUserMessage(error, "Impossible de charger les communiqués."));
  return data;
}

export async function createAnnouncement({ titre, contenu, priorite = "normale" }) {
  const { error } = await requireSupabase().rpc("create_announcement", {
    p_titre: titre,
    p_contenu: contenu,
    p_priorite: priorite,
  });
  if (error) throw new Error(toUserMessage(error, "Publication du communiqué impossible."));
}

// ============================================================================
// SERVICE CHECKLISTS : traçabilité (qui a coché quoi, et quand)
// ============================================================================
// Chaque checklist est représentée en mémoire comme un objet
// { [index]: { checked: boolean, by: string, at: string } }.
// Connecté à Supabase (`checklist_entries`, `alertes_manager`) avec fallback mémoire.

import { supabase } from "../lib/supabaseClient";

/**
 * Bascule un item de checklist et l'horodate au nom de l'utilisateur actif.
 * @param {Object} state État actuel de la checklist.
 * @param {number} index Index de l'item.
 * @param {{name:string, role:string, id?:string}} user Utilisateur connecté.
 */
export function toggleChecklistItem(state, index, user) {
  const current = state[index];
  const isChecking = !current?.checked;
  return {
    ...state,
    [index]: isChecking
      ? { checked: true, by: user?.name ?? "Utilisateur", role: user?.role ?? "", at: new Date().toISOString() }
      : { checked: false, by: null, role: null, at: null },
  };
}

/** Formatte un horodatage ISO en "12 août 2026, 14:32". */
export function formatTimestamp(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Charge les alertes Manager depuis Supabase ou renvoie le fallback.
 */
export async function fetchManagerAlerts(fallback = []) {
  if (!supabase) return fallback;

  try {
    const { data, error } = await supabase
      .from("alertes_manager")
      .select(`
        id,
        note,
        resolu,
        created_at,
        profiles (
          nom,
          role
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return fallback;
    }

    return data.map((a) => ({
      id: a.id,
      learnerName: a.note,
      raisedBy: a.profiles?.nom || "Formateur",
      role: a.profiles?.role || "formateur",
      at: a.created_at,
    }));
  } catch (err) {
    console.warn("[checklistsService] Erreur alertes Supabase :", err);
    return fallback;
  }
}

/**
 * Génère une alerte Manager pour un apprenant en difficulté (Playbook 5.7).
 */
export async function createManagerAlert(learnerName, user) {
  const alert = {
    id: `alert-${Date.now()}`,
    learnerName,
    raisedBy: user?.name ?? "Utilisateur",
    role: user?.role ?? "formateur",
    at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      await supabase.from("alertes_manager").insert({
        note: learnerName,
        signale_par: typeof user?.id === "string" && user.id.length === 36 ? user.id : null,
      });
    } catch (err) {
      console.warn("[checklistsService] Insertion Supabase impossible (fallback local) :", err);
    }
  }

  return alert;
}

/**
 * Charge les coches enregistrées pour une checklist.
 */
export async function fetchChecklistEntries(checklistKey) {
  if (!supabase) return {};
  try {
    const { data, error } = await supabase
      .from("checklist_entries")
      .select(`
        item_index,
        coche,
        horodatage,
        profiles (
          nom,
          role
        )
      `)
      .eq("checklist", checklistKey)
      .eq("coche", true);

    if (error || !data) return {};

    const entries = {};
    data.forEach((row) => {
      entries[row.item_index] = {
        checked: true,
        by: row.profiles?.nom || "Équipe EBP",
        role: row.profiles?.role || "",
        at: row.horodatage,
      };
    });
    return entries;
  } catch {
    return {};
  }
}

/**
 * Sauvegarde la coche d'un item dans Supabase.
 */
export async function saveChecklistEntry(checklistKey, index, isChecking, user) {
  if (!supabase) return;
  try {
    if (isChecking) {
      await supabase.from("checklist_entries").insert({
        checklist: checklistKey,
        item_index: index,
        coche: true,
        utilisateur_id: typeof user?.id === "string" && user.id.length === 36 ? user.id : null,
      });
    } else {
      await supabase
        .from("checklist_entries")
        .delete()
        .eq("checklist", checklistKey)
        .eq("item_index", index);
    }
  } catch {
    // Ignorer les erreurs d'écriture hors-ligne
  }
}

/** Calcule, pour la date du jour, quelle échéance clé du mois est la plus proche. */
export function getUpcomingKeyDate(keyDates, today = new Date()) {
  const day = today.getDate();
  const upcoming = keyDates.find((k) => k.day >= day);
  return upcoming ?? keyDates[0];
}

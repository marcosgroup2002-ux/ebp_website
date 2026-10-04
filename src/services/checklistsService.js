
import { supabase } from "../lib/supabaseClient";
import { logAuditEvent } from "./auditService";

const LOCAL_CHECKLIST_KEY = "ebp_secretary_checklists";

export function formatTimestamp(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function toggleChecklistItem(state, index, user) {
  const current = state[index];
  const isChecking = !current?.checked;
  return {
    ...state,
    [index]: isChecking
      ? { checked: true, by: user?.name ?? "Miss Amirath (Secrétaire)", role: user?.role ?? "secretaire", at: new Date().toISOString() }
      : { checked: false, by: null, role: null, at: null },
  };
}

export async function fetchChecklistEntries(checklistKey = "secretaire") {
  const local = (() => {
    try {
      const stored = localStorage.getItem(`${LOCAL_CHECKLIST_KEY}_${checklistKey}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  })();

  if (!supabase) return local;

  try {
    const { data, error } = await supabase
      .from("checklist_entries")
      .select("item_index, coche, horodatage, coche_par")
      .eq("checklist", checklistKey)
      .eq("coche", true);

    if (error || !data) return local;

    const entries = { ...local };
    data.forEach((row) => {
      entries[row.item_index] = {
        checked: true,
        by: row.coche_par || "Miss Amirath (Secrétaire)",
        role: "secretaire",
        at: row.horodatage,
      };
    });
    return entries;
  } catch {
    return local;
  }
}

export async function saveChecklistEntry(checklistKey, index, isChecking, itemLabelOrUser, maybeUser) {
  let itemLabel = "";
  let user = null;
  if (typeof itemLabelOrUser === "string") {
    itemLabel = itemLabelOrUser;
    user = maybeUser;
  } else {
    user = itemLabelOrUser;
  }

  try {
    const stored = JSON.parse(localStorage.getItem(`${LOCAL_CHECKLIST_KEY}_${checklistKey}`) || "{}");
    if (isChecking) {
      stored[index] = {
        checked: true,
        by: user?.name || "Miss Amirath (Secrétaire)",
        role: user?.role || "secretaire",
        at: new Date().toISOString(),
      };
    } else {
      delete stored[index];
    }
    localStorage.setItem(`${LOCAL_CHECKLIST_KEY}_${checklistKey}`, JSON.stringify(stored));
  } catch {

  }

  if (supabase) {
    try {
      if (isChecking) {
        await supabase.from("checklist_entries").insert({
          checklist: checklistKey,
          item_index: index,
          coche: true,
          coche_par: user?.name || "Miss Amirath (Secrétaire)",
        });
      } else {
        await supabase
          .from("checklist_entries")
          .delete()
          .eq("checklist", checklistKey)
          .eq("item_index", index);
      }
    } catch (err) {
      console.warn("[checklistsService] Erreur synchronisation checklist Supabase :", err);
    }
  }

  await logAuditEvent({
    action: isChecking ? "CHECKLIST_VALIDEE" : "CHECKLIST_ANNULEE",
    details: `${isChecking ? "Validation" : "Annulation"} de l'item "${itemLabel || `Tâche #${index + 1}`}" par la secrétaire.`,
    user,
  });
}

export function getUpcomingKeyDate(keyDates, today = new Date()) {
  const day = today.getDate();
  const upcoming = keyDates.find((k) => k.day >= day);
  return upcoming ?? keyDates[0];
}

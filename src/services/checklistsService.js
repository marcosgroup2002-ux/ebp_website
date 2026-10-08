import { requireSupabase, toUserMessage } from "../lib/supabaseClient";

export async function fetchChecklistEntries(checklistKey = "secretaire") {
  const { data, error } = await requireSupabase()
    .from("checklist_entries")
    .select("item_index, coche, horodatage, coche_par")
    .eq("checklist", checklistKey)
    .eq("coche", true);

  if (error) throw new Error(toUserMessage(error, "Impossible de charger la checklist."));

  const entries = {};
  data.forEach((row) => {
    entries[row.item_index] = { checked: true, by: row.coche_par, at: row.horodatage };
  });
  return entries;
}

export async function saveChecklistEntry(checklistKey, index, isChecking, itemLabel) {
  const { error } = await requireSupabase().rpc("set_checklist_item", {
    p_checklist: checklistKey,
    p_index: index,
    p_checked: isChecking,
    p_label: itemLabel,
  });
  if (error) throw new Error(toUserMessage(error, "Mise à jour de la checklist impossible."));
  return fetchChecklistEntries(checklistKey);
}

export function getUpcomingKeyDate(keyDates, today = new Date()) {
  const day = today.getDate();
  const upcoming = keyDates.find((k) => k.day >= day);
  return upcoming ?? keyDates[0];
}

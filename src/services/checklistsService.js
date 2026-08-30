// ============================================================================
// SERVICE CHECKLISTS : traçabilité (qui a coché quoi, et quand)
// ============================================================================
// Chaque checklist est représentée en mémoire comme un objet
// { [index]: { checked: boolean, by: string, at: string } }.
// Le passage à un vrai backend consiste à répliquer cette forme dans une
// table `checklist_entries` (voir docs/schema.sql) : une ligne par
// (checklist, item, utilisateur, horodatage) plutôt qu'un simple booléen.

/**
 * Bascule un item de checklist et l'horodate au nom de l'utilisateur actif.
 * @param {Object} state État actuel de la checklist.
 * @param {number} index Index de l'item.
 * @param {{name:string, role:string}} user Utilisateur connecté (démo).
 */
export function toggleChecklistItem(state, index, user) {
  const current = state[index];
  const isChecking = !current?.checked;
  return {
    ...state,
    [index]: isChecking
      ? { checked: true, by: user.name, role: user.role, at: new Date().toISOString() }
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
 * Génère une alerte Manager pour un apprenant en difficulté (Playbook 5.7 :
 * "Signaler au Manager tout apprenant en difficulté deux semaines de
 * suite"). En production, ceci déclenche une notification réelle
 * (WhatsApp API ou email) : voir docs/backend-integration.md, Partie 3
 * "Vision long terme" du brief stagiaire.
 */
export function createManagerAlert(learnerName, user) {
  return {
    id: `alert-${Date.now()}`,
    learnerName,
    raisedBy: user.name,
    role: user.role,
    at: new Date().toISOString(),
  };
}

/** Calcule, pour la date du jour, quelle échéance clé du mois est la plus proche. */
export function getUpcomingKeyDate(keyDates, today = new Date()) {
  const day = today.getDate();
  const upcoming = keyDates.find((k) => k.day >= day);
  return upcoming ?? keyDates[0];
}

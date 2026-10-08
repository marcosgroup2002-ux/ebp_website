import { requireSupabase, toUserMessage } from "../lib/supabaseClient";

export const FORMULA_LABELS = {
  echelonne: "Paiement échelonné",
  bloc: "Paiement en bloc (cash)",
};

export async function fetchTarifs() {
  const { data, error } = await requireSupabase()
    .from("tarifs")
    .select("option_paiement, montant, updated_at, updated_by");
  if (error) throw new Error(toUserMessage(error, "Impossible de charger les tarifs."));

  const tarifs = {};
  data.forEach((row) => {
    tarifs[row.option_paiement] = {
      amount: Number(row.montant),
      updatedAt: row.updated_at,
      updatedBy: row.updated_by,
    };
  });
  return tarifs;
}

export async function updateTarif(option, amount) {
  const { error } = await requireSupabase().rpc("set_tarif", { p_option: option, p_montant: amount });
  if (error) throw new Error(toUserMessage(error, "Modification du tarif impossible."));
  return fetchTarifs();
}

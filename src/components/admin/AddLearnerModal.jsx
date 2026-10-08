import { useState } from "react";
import { useForm } from "react-hook-form";
import Modal from "./Modal";
import { ACTIVE_CENTERS, PAYMENT_MODES, getActiveCohorts, addCohort } from "../../data/adminData";

export default function AddLearnerModal({ open, onClose, onSubmitLearner }) {
  const [cohortsList, setCohortsList] = useState(getActiveCohorts);
  const [showCustomCohort, setShowCustomCohort] = useState(false);
  const [customCohort, setCustomCohort] = useState("");
  const [submitError, setSubmitError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      center: ACTIVE_CENTERS[0],
      cohortNumber: cohortsList[cohortsList.length - 1] || "18.8",
      option: "echelonne",
      initialPayment: 20000,
      paymentMode: PAYMENT_MODES[0],
    },
  });

  const option = watch("option");

  const handleAddCustomCohort = () => {
    const trimmed = customCohort.trim();
    if (!/^[0-9]{1,3}.[0-9]{1,3}$/.test(trimmed)) {
      setSubmitError("Format de cohorte attendu : 18.9, 19.0…");
      return;
    }
    setSubmitError("");
    const updated = addCohort(trimmed);
    setCohortsList(updated);
    setValue("cohortNumber", trimmed);
    setCustomCohort("");
    setShowCustomCohort(false);
  };

  const close = () => {
    setSubmitError("");
    onClose();
  };

  const submit = async (data) => {
    setSubmitError("");
    try {
      await onSubmitLearner({
        name: data.name.trim(),
        center: data.center,
        cohortNumber: data.cohortNumber,
        option: data.option,
        initialPayment: Number(data.initialPayment) || 0,
        paymentMode: data.paymentMode,
      });
      reset();
      setShowCustomCohort(false);
      setCustomCohort("");
      onClose();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Inscrire un nouvel apprenant">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">Nom complet de l'apprenant</label>
          <input
            placeholder="Ex : Koffi Mensah"
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("name", {
              required: "Le nom complet est obligatoire.",
              minLength: { value: 2, message: "Le nom doit comporter au moins 2 caractères." },
              maxLength: { value: 80, message: "Le nom est trop long." },
            })}
          />
          {errors.name && <p className="mt-1 text-xs text-ebp-red-soft">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/70">Centre de formation</label>
            <select
              className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
              {...register("center", { required: true })}
            >
              {ACTIVE_CENTERS.map((c) => (
                <option key={c} value={c}>
                  Centre {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/70">Cohorte active</label>
            {!showCustomCohort ? (
              <>
                <select
                  className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  {...register("cohortNumber", { required: true })}
                >
                  {cohortsList.map((co) => (
                    <option key={co} value={co}>
                      Cohorte {co}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCustomCohort(true)}
                  className="mt-1 text-[11px] text-ebp-blue hover:underline font-medium"
                >
                  + Ajouter une nouvelle cohorte
                </button>
              </>
            ) : (
              <div className="space-y-1.5">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customCohort}
                    onChange={(e) => setCustomCohort(e.target.value)}
                    placeholder="Ex : 18.9, 19.0..."
                    className="flex-1 rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCohort}
                    className="rounded-xl bg-ebp-green px-3 py-2 text-xs font-bold text-white hover:bg-ebp-green/90 transition-colors"
                  >
                    OK
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomCohort(false)}
                  className="text-[11px] text-ink/50 hover:text-ink"
                >
                  ← Retour à la liste
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/70">Formule & Tarification</label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition-all ${
                option === "echelonne"
                  ? "border-ebp-blue bg-ebp-blue/5 font-semibold text-ebp-blue shadow-sm"
                  : "border-ink/10 text-ink/60 hover:bg-surface"
              }`}
            >
              <input type="radio" value="echelonne" className="sr-only" {...register("option")} />
              Échelonné (180 000 F)
            </label>
            <label
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition-all ${
                option === "bloc"
                  ? "border-ebp-blue bg-ebp-blue/5 font-semibold text-ebp-blue shadow-sm"
                  : "border-ink/10 text-ink/60 hover:bg-surface"
              }`}
            >
              <input type="radio" value="bloc" className="sr-only" {...register("option")} />
              Bloc Cash (150 000 F)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/70">Versement initial (FCFA)</label>
            <input
              type="number"
              min="0"
              step="5000"
              className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
              {...register("initialPayment", {
                min: { value: 0, message: "Le montant ne peut être négatif." },
                max: {
                  value: option === "bloc" ? 150000 : 180000,
                  message: "Le versement dépasse le total de la formule.",
                },
              })}
            />
            {errors.initialPayment && (
              <p className="mt-1 text-xs text-ebp-red-soft">{errors.initialPayment.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/70">Mode de paiement</label>
            <select
              className="w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
              {...register("paymentMode")}
            >
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2">
          {submitError && (
            <p role="alert" className="mb-2 text-xs text-ebp-red-soft">
              {submitError}
            </p>
          )}
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full shadow-md disabled:opacity-60">
            {isSubmitting ? "Inscription en cours..." : "Valider l'inscription de l'apprenant"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

import { useForm } from "react-hook-form";
import Modal from "./Modal";
import { PAYMENT_MODES } from "../../data/adminData";

const COHORT_OPTIONS = ["Cohorte 19 · Cotonou", "Cohorte 19 · Calavi", "Cohorte 19 · En ligne"];

export default function AddLearnerModal({ open, onClose, onSubmitLearner }) {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { name: "", cohort: COHORT_OPTIONS[0], option: "echelonne", initialPayment: 20000, paymentMode: PAYMENT_MODES[0] },
  });

  const option = watch("option");

  const submit = (data) => {
    onSubmitLearner({ ...data, initialPayment: Number(data.initialPayment) || 0 });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ajouter un apprenant">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/50">Nom complet</label>
          <input
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("name", {
              required: "Ce champ est requis.",
              minLength: { value: 2, message: "Le nom doit contenir au moins 2 caractères." },
              maxLength: { value: 80, message: "Le nom est trop long." },
            })}
          />
          {errors.name && <p className="mt-1 text-xs text-ebp-red-soft">{errors.name.message}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/50">Cohorte</label>
          <select
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("cohort", { required: true })}
          >
            {COHORT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/50">Option de paiement</label>
          <div className="grid grid-cols-2 gap-2">
            <label
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm ${
                option === "echelonne" ? "border-ebp-blue bg-ebp-blue/5 text-ebp-blue" : "border-ink/10 text-ink/60"
              }`}
            >
              <input type="radio" value="echelonne" className="sr-only" {...register("option")} />
              Échelonné (180k)
            </label>
            <label
              className={`cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm ${
                option === "bloc" ? "border-ebp-blue bg-ebp-blue/5 text-ebp-blue" : "border-ink/10 text-ink/60"
              }`}
            >
              <input type="radio" value="bloc" className="sr-only" {...register("option")} />
              Bloc (150k)
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/50">Versement initial</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
              {...register("initialPayment", {
                min: { value: 0, message: "Le montant ne peut pas être négatif." },
              })}
            />
            {errors.initialPayment && (
              <p className="mt-1 text-xs text-ebp-red-soft">{errors.initialPayment.message}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink/50">Mode</label>
            <select
              className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
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

        <button type="submit" className="btn-primary w-full">
          Ajouter l'apprenant
        </button>
      </form>
    </Modal>
  );
}

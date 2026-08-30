import { useForm } from "react-hook-form";
import Modal from "./Modal";
import { PAYMENT_MODES } from "../../data/adminData";

export default function PaymentFormModal({ learner, open, onClose, onSubmitPayment }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { amount: "", mode: PAYMENT_MODES[0], date: new Date().toISOString().slice(0, 10) },
  });

  if (!learner) return null;

  const submit = (data) => {
    onSubmitPayment(learner.id, { amount: Number(data.amount), mode: data.mode, date: data.date });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`Nouveau paiement · ${learner.name}`}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/50">Montant (FCFA)</label>
          <input
            type="number"
            min="1"
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("amount", { required: true, min: 1 })}
          />
          {errors.amount && <p className="mt-1 text-xs text-ebp-red-soft">Indiquez un montant valide.</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/50">Mode de paiement</label>
          <select
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("mode", { required: true })}
          >
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-ink/50">Date</label>
          <input
            type="date"
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("date", { required: true })}
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Enregistrer le paiement
        </button>
      </form>
    </Modal>
  );
}

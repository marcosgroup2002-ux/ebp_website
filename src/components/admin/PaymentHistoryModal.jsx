import { Plus } from "lucide-react";
import Modal from "./Modal";
import { STATUS_LABELS, formatFcfa } from "../../data/adminData";

const TONE_CLASSES = {
  green: "bg-ebp-green/10 text-ebp-green",
  red: "bg-red-100 text-ebp-red-soft",
  blue: "bg-ebp-blue/10 text-ebp-blue",
};

export default function PaymentHistoryModal({ learner, open, onClose, onAddPayment }) {
  if (!learner) return null;
  const remaining = learner.total - learner.paid;

  return (
    <Modal open={open} onClose={onClose} title={learner.name} maxWidth="max-w-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[STATUS_LABELS[learner.status].tone]}`}>
          {STATUS_LABELS[learner.status].label}
        </span>
        <span className="text-xs text-ink/50">{learner.cohort}</span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-surface p-3">
          <p className="text-[11px] font-medium text-ink/40">Total</p>
          <p className="mt-0.5 font-display text-sm font-bold text-ink">{formatFcfa(learner.total)}</p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-[11px] font-medium text-ink/40">Payé</p>
          <p className="mt-0.5 font-display text-sm font-bold text-ebp-green">{formatFcfa(learner.paid)}</p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-[11px] font-medium text-ink/40">Restant</p>
          <p className="mt-0.5 font-display text-sm font-bold text-ebp-blue">{formatFcfa(remaining)}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Historique des versements</p>
        <button
          onClick={() => onAddPayment(learner)}
          className="inline-flex items-center gap-1.5 rounded-full bg-ebp-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-ebp-green-light"
        >
          <Plus size={13} />
          Enregistrer un paiement
        </button>
      </div>

      <ul className="mt-3 divide-y divide-ink/5 rounded-xl border border-ink/10">
        {learner.history.length === 0 && (
          <li className="px-4 py-4 text-center text-sm text-ink/40">Aucun versement enregistré.</li>
        )}
        {learner.history.map((h, i) => (
          <li key={i} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-ink">{formatFcfa(h.amount)}</p>
              <p className="text-xs text-ink/45">{h.mode}</p>
            </div>
            <span className="text-xs text-ink/50">{h.date}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

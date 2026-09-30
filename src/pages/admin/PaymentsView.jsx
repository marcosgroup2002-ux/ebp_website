import { useEffect, useMemo, useState } from "react";
import { Search, AlertTriangle, UserPlus, Download, Bell, ChevronRight, Plus } from "lucide-react";
import { SAMPLE_LEARNERS, STATUS_LABELS, formatFcfa } from "../../data/adminData";
import {
  fetchLearners,
  createLearner,
  recordPayment,
  getOverdueLearners,
  learnersToCSV,
  downloadTextFile,
} from "../../services/paymentsService";
import PaymentHistoryModal from "../../components/admin/PaymentHistoryModal";
import PaymentFormModal from "../../components/admin/PaymentFormModal";
import AddLearnerModal from "../../components/admin/AddLearnerModal";
import RemindersModal from "../../components/admin/RemindersModal";

const TONE_CLASSES = {
  green: "bg-ebp-green/10 text-ebp-green",
  red: "bg-red-100 text-ebp-red-soft",
  blue: "bg-ebp-blue/10 text-ebp-blue",
};

export default function PaymentsView() {
  const [learners, setLearners] = useState(SAMPLE_LEARNERS);

  useEffect(() => {
    let isMounted = true;
    fetchLearners(SAMPLE_LEARNERS).then((data) => {
      if (isMounted && data && data.length > 0) {
        setLearners(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [historyLearner, setHistoryLearner] = useState(null);
  const [paymentLearner, setPaymentLearner] = useState(null);
  const [addLearnerOpen, setAddLearnerOpen] = useState(false);
  const [reminderStage, setReminderStage] = useState(null);

  const filtered = useMemo(() => {
    return learners.filter((l) => {
      const matchesQuery = l.name.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [learners, query, statusFilter]);

  const totals = useMemo(() => {
    const paid = learners.reduce((sum, l) => sum + l.paid, 0);
    const remaining = learners.reduce((sum, l) => sum + (l.total - l.paid), 0);
    const lateCount = learners.filter((l) => l.status === "en_retard" || l.status === "suspendu").length;
    return { paid, remaining, lateCount };
  }, [learners]);

  const overdueByStage = useMemo(
    () => ({
      J5: getOverdueLearners(learners, "J5"),
      J10: getOverdueLearners(learners, "J10"),
    }),
    [learners]
  );

  const handleAddLearner = async (payload) => {
    const updated = await createLearner(learners, payload);
    setLearners(updated);
  };

  const handleAddPayment = async (learnerId, payment) => {
    const updated = await recordPayment(learners, learnerId, payment);
    setLearners(updated);
    // garder le tiroir d'historique synchronisé s'il est ouvert sur cet apprenant
    setHistoryLearner((prev) => (prev && prev.id === learnerId ? updated.find((l) => l.id === learnerId) : prev));
  };

  const exportCSV = () => {
    downloadTextFile(`ebp-paiements-${new Date().toISOString().slice(0, 10)}.csv`, learnersToCSV(learners));
  };

  return (
    <div>
      <div className="mb-1 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
        <AlertTriangle size={13} />
        Données de démonstration : à connecter à Google Sheets ou une base de données réelle.
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Suivi des paiements</h1>
          <p className="mt-1 text-sm text-ink/50">
            Remplace le tableau de suivi manuel (Playbook 3.2) et les relances aux impayés (3.3).
          </p>
        </div>
        <button onClick={() => setAddLearnerOpen(true)} className="btn-primary w-full shrink-0 sm:w-auto">
          <UserPlus size={15} />
          Ajouter un apprenant
        </button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Total encaissé</p>
          <p className="mt-1 font-display text-2xl font-bold text-ebp-green">{formatFcfa(totals.paid)}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Restant à encaisser</p>
          <p className="mt-1 font-display text-2xl font-bold text-ebp-blue">{formatFcfa(totals.remaining)}</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">En retard / suspendus</p>
          <p className="mt-1 font-display text-2xl font-bold text-ebp-red-soft">{totals.lateCount}</p>
        </div>
      </div>

      {/* Relances & export */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setReminderStage("J5")}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 hover:border-ebp-blue hover:text-ebp-blue"
        >
          <Bell size={13} />
          Relance J5 ({overdueByStage.J5.length})
        </button>
        <button
          onClick={() => setReminderStage("J10")}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 hover:border-ebp-red-soft hover:text-ebp-red-soft"
        >
          <Bell size={13} />
          Relance J10 ({overdueByStage.J10.length})
        </button>
        <button
          onClick={exportCSV}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ebp-blue px-3.5 py-2 text-xs font-semibold text-white hover:bg-ebp-blue-dark"
        >
          <Download size={13} />
          Exporter en CSV
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un apprenant..."
            className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="px-4 py-3">Apprenant</th>
              <th className="px-4 py-3">Cohorte</th>
              <th className="px-4 py-3">Payé / Total</th>
              <th className="px-4 py-3">Prochaine échéance</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr
                key={l.id}
                onClick={() => setHistoryLearner(l)}
                className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-surface"
              >
                <td className="px-4 py-3 font-medium text-ink">{l.name}</td>
                <td className="px-4 py-3 text-ink/60">{l.cohort}</td>
                <td className="px-4 py-3 text-ink/70">
                  {formatFcfa(l.paid)} / {formatFcfa(l.total)}
                </td>
                <td className="px-4 py-3 text-ink/60">{l.nextDueDate ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[STATUS_LABELS[l.status].tone]}`}>
                    {STATUS_LABELS[l.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPaymentLearner(l);
                      }}
                      aria-label="Enregistrer un paiement"
                      className="flex h-7 w-7 items-center justify-center rounded-full text-ink/40 hover:bg-ebp-green/10 hover:text-ebp-green"
                    >
                      <Plus size={14} />
                    </button>
                    <ChevronRight size={15} className="text-ink/25" />
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-ink/40">
                  Aucun apprenant ne correspond à cette recherche.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <PaymentHistoryModal
        learner={historyLearner}
        open={Boolean(historyLearner)}
        onClose={() => setHistoryLearner(null)}
        onAddPayment={(l) => setPaymentLearner(l)}
      />
      <PaymentFormModal
        learner={paymentLearner}
        open={Boolean(paymentLearner)}
        onClose={() => setPaymentLearner(null)}
        onSubmitPayment={handleAddPayment}
      />
      <AddLearnerModal open={addLearnerOpen} onClose={() => setAddLearnerOpen(false)} onSubmitLearner={handleAddLearner} />
      <RemindersModal
        open={Boolean(reminderStage)}
        onClose={() => setReminderStage(null)}
        stage={reminderStage}
        learners={reminderStage ? overdueByStage[reminderStage] : []}
      />
    </div>
  );
}

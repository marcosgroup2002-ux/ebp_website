import { useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Download, Bell, ChevronRight, Plus, Trash2, MapPin } from "lucide-react";
import { STATUS_LABELS, ACTIVE_CENTERS, ACTIVE_COHORTS, formatFcfa } from "../../data/adminData";
import {
  fetchLearners,
  createLearner,
  recordPayment,
  deleteLearner,
  getOverdueLearners,
  learnersToCSV,
  downloadTextFile,
} from "../../services/paymentsService";
import { useAdminUser } from "../../context/AdminUserContext";
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
  const { user } = useAdminUser();
  const isReadOnly = user?.role === "pdg" || user?.role === "coach";

  const [learners, setLearners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let isMounted = true;
    fetchLearners()
      .then((data) => {
        if (!isMounted) return;
        setLearners(data);
        setLoadError("");
      })
      .catch((err) => {
        if (isMounted) setLoadError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  const [query, setQuery] = useState("");
  const [centerFilter, setCenterFilter] = useState("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [historyLearner, setHistoryLearner] = useState(null);
  const [paymentLearner, setPaymentLearner] = useState(null);
  const [addLearnerOpen, setAddLearnerOpen] = useState(false);
  const [reminderStage, setReminderStage] = useState(null);

  const filtered = useMemo(() => {
    return learners.filter((l) => {
      const matchesQuery = l.name.toLowerCase().includes(query.toLowerCase());
      const matchesCenter = centerFilter === "all" || l.centre === centerFilter || (l.cohort && l.cohort.includes(centerFilter));
      const matchesCohort = cohortFilter === "all" || l.rawCohort === cohortFilter || (l.cohort && l.cohort.includes(`18.${cohortFilter.replace("18.", "")}`));
      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      return matchesQuery && matchesCenter && matchesCohort && matchesStatus;
    });
  }, [learners, query, centerFilter, cohortFilter, statusFilter]);

  const totals = useMemo(() => {
    const paid = learners.reduce((sum, l) => sum + (l.paid || 0), 0);
    const expected = learners.reduce((sum, l) => sum + (l.total || 0), 0);
    const remaining = Math.max(0, expected - paid);
    const recoveryRate = expected > 0 ? Math.round((paid / expected) * 100) : 100;
    const lateCount = learners.filter((l) => l.status === "en_retard" || l.status === "suspendu").length;
    return { paid, remaining, lateCount, recoveryRate, totalCount: learners.length };
  }, [learners]);

  const overdueByStage = useMemo(
    () => ({
      J5: getOverdueLearners(learners, "J5"),
      J10: getOverdueLearners(learners, "J10"),
    }),
    [learners]
  );

  const handleAddLearner = async (payload) => {
    const updated = await createLearner(payload);
    setLearners(updated);
  };

  const handleAddPayment = async (learnerId, payment) => {
    const updated = await recordPayment(learnerId, payment);
    setLearners(updated);
    setHistoryLearner((prev) => (prev && prev.id === learnerId ? updated.find((l) => l.id === learnerId) : prev));
  };

  const handleDeleteLearner = async (e, learnerId) => {
    e.stopPropagation();
    if (!window.confirm("Confirmez-vous la suppression définitive de cet apprenant et de ses paiements ?")) return;
    setActionError("");
    try {
      const updated = await deleteLearner(learnerId);
      setLearners(updated);
      if (historyLearner?.id === learnerId) setHistoryLearner(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const exportCSV = () => {
    downloadTextFile(`ebp-suivi-apprenants-${new Date().toISOString().slice(0, 10)}.csv`, learnersToCSV(learners));
  };

  return (
    <div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">Gestion des Apprenants & Paiements</h1>
            {isReadOnly && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                Lecture Seule (Supervision)
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink/50">
            Centres de Calavi & Cotonou · Données synchronisées en temps réel avec la base de production.
          </p>
        </div>

        {!isReadOnly && (
          <button onClick={() => setAddLearnerOpen(true)} className="btn-primary w-full shrink-0 shadow-md sm:w-auto">
            <UserPlus size={15} />
            Inscrire un apprenant
          </button>
        )}
      </div>

      {(loadError || actionError) && (
        <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ebp-red-soft">
          <span>{loadError || actionError}</span>
          {loadError && (
            <button
              onClick={() => {
                setLoading(true);
                setReloadKey((k) => k + 1);
              }}
              className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-ink shadow-sm"
            >
              Réessayer
            </button>
          )}
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Total Encaissé</p>
          <p className="mt-1 font-display text-2xl font-bold text-ebp-green">{formatFcfa(totals.paid)}</p>
          <p className="mt-1 text-xs text-ink/40">Taux de recouvrement : {totals.recoveryRate}%</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Restant à Recouvrer</p>
          <p className="mt-1 font-display text-2xl font-bold text-ebp-blue">{formatFcfa(totals.remaining)}</p>
          <p className="mt-1 text-xs text-ink/40">Sur {totals.totalCount} apprenants inscrits</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Impayés & Retards</p>
          <p className="mt-1 font-display text-2xl font-bold text-ebp-red-soft">{totals.lateCount}</p>
          <p className="mt-1 text-xs text-ebp-red-soft">J+5 ({overdueByStage.J5.length}) · J+10 ({overdueByStage.J10.length})</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Cohortes Actives</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">18.6 · 18.7 · 18.8</p>
          <p className="mt-1 text-xs text-ink/40">Calavi & Cotonou</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setReminderStage("J5")}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 hover:border-ebp-blue hover:text-ebp-blue transition-colors shadow-sm"
        >
          <Bell size={13} />
          Relances J+5 ({overdueByStage.J5.length})
        </button>
        <button
          onClick={() => setReminderStage("J10")}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 hover:border-ebp-red-soft hover:text-ebp-red-soft transition-colors shadow-sm"
        >
          <Bell size={13} />
          Relances J+10 ({overdueByStage.J10.length})
        </button>
        <button
          onClick={exportCSV}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-ebp-blue px-4 py-2 text-xs font-semibold text-white hover:bg-ebp-blue-dark transition-colors shadow-sm"
        >
          <Download size={13} />
          Exporter en CSV
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par nom..."
            className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
          />
        </div>

        <select
          value={centerFilter}
          onChange={(e) => setCenterFilter(e.target.value)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
        >
          <option value="all">Tous les centres</option>
          {ACTIVE_CENTERS.map((c) => (
            <option key={c} value={c}>
              Centre {c}
            </option>
          ))}
        </select>

        <select
          value={cohortFilter}
          onChange={(e) => setCohortFilter(e.target.value)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
        >
          <option value="all">Toutes les cohortes</option>
          {ACTIVE_COHORTS.map((co) => (
            <option key={co} value={co}>
              Cohorte {co}
            </option>
          ))}
        </select>

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

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 bg-surface/50 text-xs uppercase tracking-wide text-ink/40">
              <th className="px-4 py-3.5">Apprenant</th>
              <th className="px-4 py-3.5">Centre & Cohorte</th>
              <th className="px-4 py-3.5">Payé / Total</th>
              <th className="px-4 py-3.5">Prochaine Échéance</th>
              <th className="px-4 py-3.5">Statut</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink/40">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-ebp-blue border-t-transparent" />
                  <p className="mt-2 text-xs">Chargement des données de production...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink/40">
                  <p className="font-medium text-ink/60">Aucun apprenant trouvé.</p>
                  <p className="mt-1 text-xs text-ink/40">
                    {query || centerFilter !== "all" || cohortFilter !== "all" || statusFilter !== "all"
                      ? "Ajustez vos filtres de recherche."
                      : !isReadOnly
                      ? "Cliquez sur 'Inscrire un apprenant' pour enregistrer le premier dossier de production."
                      : "La base de données est actuellement prête pour les inscriptions."}
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr
                  key={l.id}
                  onClick={() => setHistoryLearner(l)}
                  className="cursor-pointer border-b border-ink/5 last:border-0 hover:bg-surface/80 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-ink">{l.name}</p>
                    <p className="text-xs text-ink/40">{l.option === "bloc" ? "Paiement Bloc (150k)" : "Échelonné (180k)"}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 text-ink/70">
                      <MapPin size={13} className="text-ebp-blue shrink-0" />
                      <span>{l.cohort}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-ink">
                      {formatFcfa(l.paid)} / {formatFcfa(l.total)}
                    </p>
                    {l.total - l.paid > 0 && (
                      <p className="text-xs text-ebp-red-soft">Reste : {formatFcfa(l.total - l.paid)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-ink/60">{l.nextDueDate ?? "— (Soldé)"}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        TONE_CLASSES[STATUS_LABELS[l.status]?.tone || "blue"]
                      }`}
                    >
                      {STATUS_LABELS[l.status]?.label || l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {!isReadOnly && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentLearner(l);
                            }}
                            title="Enregistrer un versement"
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-ebp-green/10 text-ebp-green hover:bg-ebp-green hover:text-white transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteLearner(e, l.id)}
                            title="Supprimer le dossier"
                            className="flex h-7 w-7 items-center justify-center rounded-full text-ink/30 hover:bg-red-50 hover:text-ebp-red-soft transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                      <ChevronRight size={15} className="text-ink/25" />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaymentHistoryModal
        learner={historyLearner}
        open={Boolean(historyLearner)}
        onClose={() => setHistoryLearner(null)}
        onAddPayment={!isReadOnly ? (l) => setPaymentLearner(l) : undefined}
      />
      {!isReadOnly && (
        <>
          <PaymentFormModal
            learner={paymentLearner}
            open={Boolean(paymentLearner)}
            onClose={() => setPaymentLearner(null)}
            onSubmitPayment={handleAddPayment}
          />
          <AddLearnerModal
            open={addLearnerOpen}
            onClose={() => setAddLearnerOpen(false)}
            onSubmitLearner={handleAddLearner}
          />
        </>
      )}
      <RemindersModal
        open={Boolean(reminderStage)}
        onClose={() => setReminderStage(null)}
        stage={reminderStage}
        learners={reminderStage ? overdueByStage[reminderStage] : []}
      />
    </div>
  );
}

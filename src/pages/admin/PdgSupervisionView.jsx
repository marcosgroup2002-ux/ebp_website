import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  ShieldAlert,
  LogIn,
  Users,
  CreditCard,
  Building,
  Send,
  Activity,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { fetchLearners, getOverdueLearners } from "../../services/paymentsService";
import { fetchAuditLogs } from "../../services/auditService";
import { createAnnouncement } from "../../services/coachService";
import { formatFcfa, ACTIVE_CENTERS, ACTIVE_COHORTS } from "../../data/adminData";

const LOGIN_ACTIONS = ["CONNEXION", "DECONNEXION"];

export default function PdgSupervisionView() {
  const [learners, setLearners] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const [communiqueTitle, setCommuniqueTitle] = useState("");
  const [communiqueContent, setCommuniqueContent] = useState("");
  const [communiquePriority, setCommuniquePriority] = useState("normale");
  const [communiqueSuccess, setCommuniqueSuccess] = useState(false);
  const [communiqueError, setCommuniqueError] = useState("");
  const [publishing, setPublishing] = useState(false);

  const loadData = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchLearners(), fetchAuditLogs(200)])
      .then(([lData, auditData]) => {
        if (!isMounted) return;
        setLearners(lData);
        setAuditLogs(auditData);
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

  useEffect(() => {
    const interval = setInterval(() => setReloadKey((k) => k + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const loginEvents = useMemo(
    () => auditLogs.filter((log) => LOGIN_ACTIONS.includes(log.action)).slice(0, 5),
    [auditLogs]
  );

  const handlePublishCommunique = async (e) => {
    e.preventDefault();
    if (publishing || !communiqueTitle.trim() || !communiqueContent.trim()) return;
    setCommuniqueError("");
    setPublishing(true);
    try {
      await createAnnouncement({
        titre: communiqueTitle.trim(),
        contenu: communiqueContent.trim(),
        priorite: communiquePriority,
      });
      setCommuniqueTitle("");
      setCommuniqueContent("");
      setCommuniqueSuccess(true);
      setTimeout(() => setCommuniqueSuccess(false), 3000);
    } catch (err) {
      setCommuniqueError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const metrics = useMemo(() => {
    const totalCount = learners.length;
    const paid = learners.reduce((sum, l) => sum + (l.paid || 0), 0);
    const expected = learners.reduce((sum, l) => sum + (l.total || 0), 0);
    const unpaid = Math.max(0, expected - paid);
    const recoveryRate = expected > 0 ? Math.round((paid / expected) * 100) : 100;

    const regularCount = learners.filter((l) => l.status === "solde" || l.status === "a_jour").length;
    const successRate = totalCount > 0 ? Math.round((regularCount / totalCount) * 100) : 100;

    const lateJ5 = getOverdueLearners(learners, "J5").length;
    const lateJ10 = getOverdueLearners(learners, "J10").length;

    const centerDistribution = { Calavi: 0, Cotonou: 0 };
    learners.forEach((l) => {
      const c = l.centre || (l.cohort && l.cohort.includes("Cotonou") ? "Cotonou" : "Calavi");
      if (centerDistribution[c] !== undefined) centerDistribution[c] += 1;
    });

    const cohortDistribution = {};
    ACTIVE_COHORTS.forEach((co) => { cohortDistribution[co] = 0; });
    learners.forEach((l) => {
      const cohortKey = l.rawCohort || (l.cohort && l.cohort.match(/(\d+\.\d+)/)?.[1]) || null;
      if (cohortKey) {
        if (cohortDistribution[cohortKey] === undefined) cohortDistribution[cohortKey] = 0;
        cohortDistribution[cohortKey] += 1;
      }
    });

    return {
      totalCount,
      paid,
      expected,
      unpaid,
      recoveryRate,
      successRate,
      lateJ5,
      lateJ10,
      centerDistribution,
      cohortDistribution,
    };
  }, [learners]);

  return (
    <div className="space-y-8">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">Supervision Stratégique & Analytics</h1>
            <span className="rounded-full bg-ebp-blue/10 px-3 py-1 text-xs font-bold text-ebp-blue">
              Espace PDG
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/50">
            Direction Générale · Contrôle et lecture analytique des données de production.
          </p>
        </div>

        <button
          onClick={loadData}
          className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink/70 hover:bg-surface transition-colors shadow-sm self-start"
        >
          <RefreshCw size={14} className={loading ? "animate-spin text-ebp-blue" : ""} />
          Actualiser les flux
        </button>
      </div>

      {loadError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ebp-red-soft">
          {loadError}
        </p>
      )}

      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
          <LogIn size={20} className="text-ebp-blue" />
          <div>
            <h2 className="font-display text-base font-bold text-ink">Dernières connexions à l'espace admin</h2>
            <p className="text-xs text-ink/50">
              Chaque connexion est authentifiée par Supabase et journalisée côté serveur (adresse IP réelle).
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {loginEvents.length === 0 ? (
            <p className="py-2 text-sm text-ink/50">Aucune connexion récente.</p>
          ) : (
            loginEvents.map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 rounded-xl border border-ink/10 bg-surface/50 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <span className="font-semibold text-ink">{log.user_name}</span>
                  <span className="ml-1 uppercase text-ink/40">({log.user_role})</span>
                  <span className="ml-2 rounded bg-ebp-blue/10 px-1.5 py-0.5 font-mono font-bold text-ebp-blue">
                    {log.action}
                  </span>
                </span>
                <span className="text-ink/50">
                  {new Date(log.created_at).toLocaleString("fr-FR")} · IP{" "}
                  <span className="font-mono text-ink">{log.ip_address || "—"}</span>
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Taux de Recouvrement</p>
            <TrendingUp size={16} className="text-ebp-green" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-ebp-green">{metrics.recoveryRate}%</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-ebp-green" style={{ width: `${metrics.recoveryRate}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink/50">
            {formatFcfa(metrics.paid)} encaissés sur {formatFcfa(metrics.expected)}
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Suivi des Impayés</p>
            <CreditCard size={16} className="text-ebp-red-soft" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-ebp-red-soft">{formatFcfa(metrics.unpaid)}</p>
          <p className="mt-3 text-xs text-ink/60">
            Relances : <span className="font-semibold text-amber-700">J+5 ({metrics.lateJ5})</span> ·{" "}
            <span className="font-semibold text-ebp-red-soft">J+10 ({metrics.lateJ10})</span>
          </p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Taux de Régularité</p>
            <Activity size={16} className="text-ebp-blue" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-ebp-blue">{metrics.successRate}%</p>
          <p className="mt-3 text-xs text-ink/50">Apprenants sans retard de paiement</p>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">Effectif Global Actif</p>
            <Users size={16} className="text-ink/40" />
          </div>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{metrics.totalCount}</p>
          <p className="mt-3 text-xs text-ink/50">Apprenants répartis sur 3 cohortes</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-ebp-blue" />
              <h3 className="font-display text-base font-bold text-ink">Inscriptions par Centre</h3>
            </div>
            <span className="text-xs text-ink/40">Calavi vs Cotonou</span>
          </div>

          <div className="mt-6 space-y-4">
            {ACTIVE_CENTERS.map((centre) => {
              const count = metrics.centerDistribution[centre] || 0;
              const percent = metrics.totalCount > 0 ? Math.round((count / metrics.totalCount) * 100) : 0;
              const isCalavi = centre === "Calavi";
              return (
                <div key={centre}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">Centre {centre}</span>
                    <span className="font-bold text-ink">
                      {count} apprenant{count > 1 ? "s" : ""} ({percent}%)
                    </span>
                  </div>
                  <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCalavi ? "bg-ebp-blue" : "bg-ebp-green"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-surface p-4 text-xs text-ink/60">
            💡 <span className="font-semibold text-ink">Supervision :</span> 4 coachs affectés à Calavi pour gérer le
            flux d'apprenants, 2 coachs affectés à Cotonou.
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-ink/10 pb-4">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-ebp-green" />
              <h3 className="font-display text-base font-bold text-ink">Inscriptions par Cohorte Active</h3>
            </div>
            <span className="text-xs text-ink/40">{Object.keys(metrics.cohortDistribution).join(" · ") || "—"}</span>
          </div>

          <div className="mt-6 space-y-4">
            {Object.keys(metrics.cohortDistribution).map((cohorte) => {
              const count = metrics.cohortDistribution[cohorte] || 0;
              const percent = metrics.totalCount > 0 ? Math.round((count / metrics.totalCount) * 100) : 0;
              return (
                <div key={cohorte}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-ink">Cohorte {cohorte}</span>
                    <span className="font-bold text-ink">
                      {count} apprenant{count > 1 ? "s" : ""} ({percent}%)
                    </span>
                  </div>
                  <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-surface">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-ebp-blue to-ebp-green transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-surface p-4 text-xs text-ink/60">
            💡 <span className="font-semibold text-ink">Cycle académique :</span> Les cohortes 18.6 et 18.7 sont en phase
            d'approfondissement, la cohorte 18.8 est en phase d'accélération initiale.
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-ink/10 pb-3">
          <Send size={18} className="text-ebp-blue" />
          <div>
            <h3 className="font-display text-base font-bold text-ink">
              Émettre une Consigne / Communiqué aux Coachs
            </h3>
            <p className="text-xs text-ink/40">Publie directement sur le fil d'actualité des 6 coachs</p>
          </div>
        </div>

        <form onSubmit={handlePublishCommunique} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Titre du communiqué</label>
            <input
              type="text"
              value={communiqueTitle}
              onChange={(e) => setCommuniqueTitle(e.target.value)}
              placeholder="Ex : Consignes pour l'évaluation de mi-parcours Cohorte 18.7"
              maxLength={150}
              className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Contenu de la consigne</label>
            <textarea
              rows={3}
              value={communiqueContent}
              onChange={(e) => setCommuniqueContent(e.target.value)}
              maxLength={3000}
              placeholder="Rédigez la consigne pédagogique ou administrative destinée à l'équipe des coachs..."
              className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-ink/60">Niveau de priorité :</label>
              <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="normale"
                  checked={communiquePriority === "normale"}
                  onChange={() => setCommuniquePriority("normale")}
                  className="accent-ebp-blue"
                />
                Information
              </label>
              <label className="flex items-center gap-1.5 text-xs text-ebp-red-soft font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="priority"
                  value="urgente"
                  checked={communiquePriority === "urgente"}
                  onChange={() => setCommuniquePriority("urgente")}
                  className="accent-ebp-red-soft"
                />
                Urgent / Important
              </label>
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="btn-primary inline-flex items-center gap-2 shadow-md disabled:opacity-60"
            >
              <Send size={14} />
              {publishing ? "Diffusion..." : "Diffuser le communiqué"}
            </button>
          </div>

          {communiqueError && (
            <p role="alert" className="text-xs font-semibold text-ebp-red-soft">
              {communiqueError}
            </p>
          )}
          {communiqueSuccess && (
            <p className="text-xs font-semibold text-ebp-green animate-fadeIn">
              ✓ Communiqué diffusé avec succès sur le fil d'actualité des coachs !
            </p>
          )}
        </form>
      </div>
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-ebp-blue" />
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Traçabilité & Journaux d'Audit
              </h3>
              <p className="text-xs text-ink/40">Dernières actions enregistrées côté serveur</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-ink/50">{auditLogs.length} événements enregistrés</span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs">
            <thead>
              <tr className="border-b border-ink/10 text-ink/40 uppercase tracking-wider">
                <th className="py-2.5 px-3">Date & Heure</th>
                <th className="py-2.5 px-3">Acteur / Rôle</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Détails</th>
                <th className="py-2.5 px-3">IP & Lieu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {auditLogs.slice(0, 8).map((log) => (
                <tr key={log.id} className="hover:bg-surface/60 transition-colors">
                  <td className="py-3 px-3 text-ink/60 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-semibold text-ink">{log.user_name}</span>
                    <span className="ml-1 text-[10px] text-ink/40 uppercase">({log.user_role})</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="rounded-md bg-ebp-blue/10 px-2 py-0.5 font-mono text-[11px] font-bold text-ebp-blue">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-ink/75 max-w-xs truncate" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-3 text-ink/50 whitespace-nowrap">
                    <span className="font-mono text-[11px]">{log.ip_address || "—"}</span>
                    {log.location && <span className="block text-[10px] text-ink/40">{log.location}</span>}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-ink/40">
                    Aucun log d'audit enregistré pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

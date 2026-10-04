import { useEffect, useState } from "react";
import { CheckCircle2, ShieldCheck, Clock, Calendar } from "lucide-react";
import { SECRETARY_CHECKLIST, KEY_DATES } from "../../data/adminData";
import { fetchChecklistEntries, saveChecklistEntry, getUpcomingKeyDate } from "../../services/checklistsService";
import { useAdminUser } from "../../context/AdminUserContext";

export default function ChecklistsView() {
  const { user } = useAdminUser();
  const [entries, setEntries] = useState({});

  useEffect(() => {
    let isMounted = true;
    fetchChecklistEntries("secretaire").then((data) => {
      if (isMounted) {
        setEntries(data || {});
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleItem = (index) => {
    const isChecking = !entries[index]?.checked;
    const itemLabel = SECRETARY_CHECKLIST[index];
    saveChecklistEntry("secretaire", index, isChecking, itemLabel, user);

    setEntries((prev) => {
      const next = { ...prev };
      if (isChecking) {
        next[index] = {
          checked: true,
          by: user?.name || "Miss Amirath (Secrétaire)",
          role: "secretaire",
          at: new Date().toISOString(),
        };
      } else {
        delete next[index];
      }
      return next;
    });
  };

  const doneCount = Object.values(entries).filter((v) => v?.checked).length;
  const progressPercent = Math.round((doneCount / SECRETARY_CHECKLIST.length) * 100);
  const nextKeyDate = getUpcomingKeyDate(KEY_DATES);

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Checklist Opérationnelle · Secrétariat</h1>
          <p className="mt-1 text-sm text-ink/50">
            Responsable : Miss Amirath (Secrétaire) · Contrôles quotidiens et procédures d'exploitation (Playbook 3.7).
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-ebp-blue/10 px-3.5 py-2 text-xs font-semibold text-ebp-blue">
          <ShieldCheck size={16} />
          Traçabilité d'audit active
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ebp-blue">
          <Calendar size={15} />
          Prochaine échéance clé du calendrier EBP
        </div>
        <p className="mt-2 text-base font-semibold text-ink">
          Jour {nextKeyDate.day} du mois : {nextKeyDate.label}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {KEY_DATES.map((kd) => (
            <span
              key={kd.day}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                kd.day === nextKeyDate.day ? "bg-ebp-blue text-white" : "bg-surface text-ink/60"
              }`}
            >
              J+{kd.day} : {kd.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">Checklist Quotidienne du Secrétariat</h2>
            <p className="text-xs text-ink/45">À clôturer chaque jour avant 18h00</p>
          </div>
          <div className="text-right">
            <span className="font-display text-xl font-bold text-ebp-green">{progressPercent}%</span>
            <p className="text-xs text-ink/40">
              {doneCount}/{SECRETARY_CHECKLIST.length} validés
            </p>
          </div>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div
            className="h-full rounded-full bg-ebp-green transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <ul className="mt-6 divide-y divide-ink/5">
          {SECRETARY_CHECKLIST.map((item, index) => {
            const entry = entries[index];
            const isChecked = Boolean(entry?.checked);
            return (
              <li
                key={index}
                onClick={() => toggleItem(index)}
                className="flex cursor-pointer items-start gap-3.5 py-4 transition-colors hover:bg-surface/50 rounded-xl px-2"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleItem(index)}
                  className="mt-1 h-5 w-5 shrink-0 rounded accent-ebp-green cursor-pointer"
                />
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${isChecked ? "text-ink/40 line-through" : "text-ink"}`}>
                    {item}
                  </p>
                  {isChecked && (
                    <div className="mt-1 flex items-center gap-2 text-xs text-ink/40">
                      <Clock size={12} />
                      <span>
                        Validé par {entry.by} · {new Date(entry.at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                  )}
                </div>
                {isChecked && <CheckCircle2 size={18} className="text-ebp-green shrink-0 mt-0.5" />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Lock, ShieldAlert } from "lucide-react";
import {
  SECRETARY_CHECKLIST,
  TRAINER_CHECKLIST_BEFORE,
  TRAINER_CHECKLIST_AFTER,
  ONBOARDING_CHECKLIST,
  FLAGGABLE_ITEM,
} from "../../data/adminData";
import { createManagerAlert, formatTimestamp } from "../../services/checklistsService";
import { useAdminUser } from "../../context/AdminUserContext";
import ChecklistCard from "../../components/admin/ChecklistCard";
import KeyDatesBanner from "../../components/admin/KeyDatesBanner";

export default function ChecklistsView() {
  const { user } = useAdminUser();
  const [alerts, setAlerts] = useState([]);

  const handleFlag = (learnerNote) => {
    setAlerts((a) => [createManagerAlert(learnerNote, user), ...a]);
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Checklists opérationnelles</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink/50">
        Version digitale des checklists papier/WhatsApp (Playbook 3.7, 5.7 et 7.2). Chaque case cochée
        est horodatée et attribuée à {user?.name ?? "l'utilisateur connecté"}.
      </p>

      <div className="mt-6">
        <KeyDatesBanner />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ChecklistCard title="Checklist quotidienne · Secrétaire" items={SECRETARY_CHECKLIST} user={user} />
        <ChecklistCard title="Onboarding · Nouvel apprenant" items={ONBOARDING_CHECKLIST} user={user} />
        <ChecklistCard title="Avant la séance · Formateur" items={TRAINER_CHECKLIST_BEFORE} user={user} />
        <ChecklistCard
          title="Après la séance · Formateur"
          items={TRAINER_CHECKLIST_AFTER}
          user={user}
          flaggableItem={FLAGGABLE_ITEM}
          onFlag={handleFlag}
        />
      </div>

      {/* Alertes Manager générées */}
      <div className="mt-6 rounded-2xl border border-ink/10 bg-white p-6">
        <div className="flex items-center gap-2 text-ink/60">
          <ShieldAlert size={15} className="text-ebp-red-soft" />
          <p className="text-xs font-semibold uppercase tracking-wide">Alertes Manager</p>
        </div>
        {alerts.length === 0 ? (
          <p className="mt-3 text-sm text-ink/40">
            Aucune alerte pour l'instant. Cliquez sur le drapeau à côté de "Signaler au Manager..." pour en créer une.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl bg-red-50 px-4 py-2.5 text-sm">
                <span className="text-ink/75">{a.learnerName}</span>
                <span className="text-xs text-ink/45">
                  {a.raisedBy} · {formatTimestamp(a.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-ink/35">
          Démonstration : en production, ceci déclenche une vraie notification (WhatsApp API ou email) au
          Manager, comme prévu dans la Partie 3 "Vision long terme" du brief stagiaire.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-ink/15 bg-surface p-6">
        <div className="flex items-center gap-2 text-ink/50">
          <Lock size={14} />
          <p className="text-xs font-semibold uppercase tracking-wide">Modules à venir (Niveau 2 & 3)</p>
        </div>
        <div className="mt-3 grid gap-2 text-sm text-ink/50 sm:grid-cols-2">
          <p>Suivi pédagogique (pretest / posttest, alertes automatiques)</p>
          <p>Mini-CRM leads & tags de nurturing</p>
          <p>Tableau de KPIs EBP (closing, rétention, présence)</p>
          <p>Authentification par rôle avec de vrais comptes</p>
        </div>
      </div>
    </div>
  );
}

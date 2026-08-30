import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ShieldAlert, ChevronRight } from "lucide-react";
import { AdminUserProvider, useAdminUser } from "../../context/AdminUserContext";
import { SAMPLE_USERS } from "../../data/adminData";

// PROTOTYPE : PAS UNE VRAIE SÉCURITÉ.
// Ce code tourne dans le navigateur : n'importe qui peut lire ce mot de passe
// en inspectant le bundle JS. Il sert uniquement à cacher le dashboard des
// visiteurs occasionnels pendant le développement. Avant toute donnée réelle
// d'apprenant, remplacer ce gate par une vraie authentification côté serveur
// avec de vrais comptes par rôle (secrétaire / formateur / Manager /
// Promoteur) : voir docs/backend-integration.md.
const DEMO_PASSWORD = "ebp-admin-2026";
const SESSION_KEY = "ebp_admin_authed";

function PasswordStep({ onSuccess }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === DEMO_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "true");
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Mot de passe"
        className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
        autoFocus
      />
      {error && <p className="mt-2 text-xs text-ebp-red-soft">Mot de passe incorrect.</p>}
      <button type="submit" className="btn-primary mt-4 w-full">
        Continuer
      </button>
    </form>
  );
}

function IdentityStep() {
  const { setUser } = useAdminUser();

  return (
    <div className="mt-6">
      <p className="text-xs font-medium text-ink/50">Connecté en tant que</p>
      <div className="mt-3 space-y-2">
        {SAMPLE_USERS.map((u) => (
          <button
            key={u.id}
            onClick={() => setUser(u)}
            className="flex w-full items-center justify-between rounded-xl border border-ink/10 px-4 py-3 text-left text-sm transition-colors hover:border-ebp-green hover:bg-ebp-green/5"
          >
            <span>
              <span className="font-medium text-ink">{u.name}</span>
              <span className="ml-2 text-xs text-ink/40">{u.role}</span>
            </span>
            <ChevronRight size={15} className="text-ink/30" />
          </button>
        ))}
      </div>
      <p className="mt-4 text-xs text-ink/40">
        Démonstration : dans la vraie version, l'identité vient d'un vrai compte, pas d'une liste.
      </p>
    </div>
  );
}

function GateContent({ children }) {
  const [passwordOk, setPasswordOk] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const { user } = useAdminUser();

  useEffect(() => {
    document.title = "Espace Admin · EBP";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
  }, []);

  if (passwordOk && user) return children;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-11 w-auto rounded-md" />
        <h1 className="mt-5 font-display text-lg font-semibold text-ink">Espace Admin EBP</h1>
        <p className="mt-1 text-sm text-ink/50">Accès réservé à l'équipe EBP.</p>

        {!passwordOk ? <PasswordStep onSuccess={() => setPasswordOk(true)} /> : <IdentityStep />}

        <div className="mt-6 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          Prototype de démonstration : à remplacer par une vraie authentification avant toute donnée
          réelle d'apprenant.
        </div>
      </div>
    </div>
  );
}

export default function AdminGate() {
  return (
    <AdminUserProvider>
      <GateContent>
        <Outlet />
      </GateContent>
    </AdminUserProvider>
  );
}

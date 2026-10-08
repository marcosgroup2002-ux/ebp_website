import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ShieldCheck, ArrowRight, Eye, EyeOff } from "lucide-react";
import { AdminUserProvider, useAdminUser } from "../../context/AdminUserContext";
import { supabase } from "../../lib/supabaseClient";

function GateForm() {
  const { signIn, sessionError } = useAdminUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err.message || "Connexion impossible.");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  const displayedError = error || sessionError;

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <div>
        <label htmlFor="admin-email" className="block text-xs font-semibold text-ink/60 mb-1">
          Email professionnel
        </label>
        <input
          id="admin-email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
          required
        />
      </div>

      <div>
        <label htmlFor="admin-password" className="block text-xs font-semibold text-ink/60 mb-1">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="admin-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full rounded-xl border border-ink/10 pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink transition-colors"
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {displayedError && (
        <p role="alert" className="text-xs text-ebp-red-soft">
          {displayedError}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !supabase}
        className="btn-primary w-full shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Connexion..." : "Se connecter"}
        <ArrowRight size={14} />
      </button>

      {!supabase && (
        <p className="text-xs text-ebp-red-soft">Service d'authentification indisponible (configuration manquante).</p>
      )}

      <p className="rounded-lg bg-slate-100 p-2.5 text-[11px] text-ink/70 border border-ink/10">
        Votre rôle (Secrétariat, Coach ou Direction) est déterminé automatiquement par votre compte. Chaque connexion
        est journalisée.
      </p>
    </form>
  );
}

function GateContent({ children }) {
  const { user, loading } = useAdminUser();

  useEffect(() => {
    document.title = "Administration EBP · Accès Sécurisé";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    );
  }

  if (user) return children;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card border border-white/10">
        <div className="flex items-center gap-3">
          <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-10 w-auto rounded-lg shadow-sm" />
          <div>
            <h1 className="font-display text-lg font-bold text-ink">Espace Administration</h1>
            <p className="text-xs text-ink/50">Système sécurisé d'exploitation EBP</p>
          </div>
        </div>

        <GateForm />

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-ink/5 pt-4 text-[11px] text-ink/40">
          <ShieldCheck size={14} className="text-ebp-green" />
          <span>Connexion chiffrée · Calavi & Cotonou</span>
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

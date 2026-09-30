import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { AdminUserProvider, useAdminUser } from "../../context/AdminUserContext";
import { SAMPLE_USERS } from "../../data/adminData";
import { supabase } from "../../lib/supabaseClient";

const DEMO_PASSWORD_HASH = "247cb54108d43e4359913fe4b410f2624b041fc8cc3fe95ceedac895171f930d";
const SESSION_KEY = "ebp_admin_authed";

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function AuthStep({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const { setUser } = useAdminUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setChecking(true);

    try {
      // 1. Si un email est renseigné et que Supabase est disponible, tente Supabase Auth
      if (email.trim() && supabase) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authErr) {
          setChecking(false);
          setError(authErr.message || "Email ou mot de passe incorrect.");
          return;
        }

        if (data?.user) {
          // Récupération du profil depuis la table profiles
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .single();

          const authUser = profile
            ? { id: profile.id, name: profile.nom, role: profile.role }
            : {
                id: data.user.id,
                name: data.user.user_metadata?.nom || data.user.email?.split("@")[0] || "Administrateur",
                role: data.user.user_metadata?.role || "secretaire",
              };

          setUser(authUser);
          sessionStorage.setItem(SESSION_KEY, "true");
          setChecking(false);
          onSuccess();
          return;
        }
      }

      // 2. Fallback démo : vérification du mot de passe direct
      const hash = await sha256Hex(password);
      setChecking(false);

      if (hash === DEMO_PASSWORD_HASH) {
        sessionStorage.setItem(SESSION_KEY, "true");
        onSuccess();
      } else {
        setError("Mot de passe ou identifiants incorrects.");
      }
    } catch (err) {
      console.warn("[AdminGate] Erreur authentification :", err);
      setChecking(false);
      setError("Erreur de connexion. Veuillez réessayer.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email professionnel (ou vide pour démo)"
        className="w-full rounded-xl border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
        autoFocus
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe"
        className="mt-3 w-full rounded-xl border border-ink/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
      />
      {error && <p className="mt-2 text-xs text-ebp-red-soft">{error}</p>}
      <button type="submit" className="btn-primary mt-4 w-full" disabled={checking}>
        {checking ? "Vérification..." : "Se connecter"}
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
        Rôle démo actif : pour vous connecter avec votre vrai profil, saisissez votre email sur l'écran précédent.
      </p>
    </div>
  );
}

function GateContent({ children }) {
  const [passwordOk, setPasswordOk] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const { user, setUser } = useAdminUser();

  useEffect(() => {
    document.title = "Espace Admin · EBP";
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    meta.content = "noindex, nofollow";

    // Vérifie si une session Supabase existe déjà
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user && !user) {
          supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single()
            .then(({ data: profile }) => {
              if (profile) {
                setUser({ id: profile.id, name: profile.nom, role: profile.role });
              } else {
                setUser({
                  id: session.user.id,
                  name: session.user.user_metadata?.nom || session.user.email?.split("@")[0] || "Administrateur",
                  role: session.user.user_metadata?.role || "secretaire",
                });
              }
              setPasswordOk(true);
            });
        }
      });
    }
  }, [user, setUser]);

  if (passwordOk && user) return children;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-card">
        <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-11 w-auto rounded-md" />
        <h1 className="mt-5 font-display text-lg font-semibold text-ink">Espace Admin EBP</h1>
        <p className="mt-1 text-sm text-ink/50">Accès réservé à l'équipe EBP.</p>

        {!passwordOk ? <AuthStep onSuccess={() => setPasswordOk(true)} /> : <IdentityStep />}

        <div className="mt-6 flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
          <ShieldCheck size={14} className="mt-0.5 shrink-0 text-ebp-green" />
          Authentification Supabase Auth active. Vous pouvez vous connecter avec votre compte ou via le mot de passe d'équipe.
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

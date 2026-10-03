import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ShieldCheck, GraduationCap, ArrowRight, ShieldAlert, CheckCircle2, Mail, Eye, EyeOff } from "lucide-react";
import { AdminUserProvider, useAdminUser } from "../../context/AdminUserContext";
import {
  initiateSecretaryLogin,
  verifySecretaryOtp,
  loginCoach,
  loginPdg,
  CREDENTIALS,
} from "../../services/authService";

const SESSION_KEY = "ebp_admin_authed";

function GateForm({ onSuccess }) {
  const { setUser } = useAdminUser();
  const [activeTab, setActiveTab] = useState("secretaire"); // 'secretaire' | 'coach' | 'pdg'

  // États pour Secrétaire
  const [secEmail, setSecEmail] = useState(CREDENTIALS.secretaire.email);
  const [secPassword, setSecPassword] = useState("");
  const [showSecPassword, setShowSecPassword] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // États pour Coach
  const [coachPassword, setCoachPassword] = useState("");
  const [showCoachPassword, setShowCoachPassword] = useState(false);

  // États pour PDG
  const [pdgEmail, setPdgEmail] = useState(CREDENTIALS.pdg.email);
  const [pdgPassword, setPdgPassword] = useState("");
  const [showPdgPassword, setShowPdgPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 1. Soumission Secrétaire (Étape 1 : Email + Mot de passe -> Génération OTP)
  const handleSecretarySubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await initiateSecretaryLogin(secEmail, secPassword);
      setOtpStep(true);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err.message || "Identifiants incorrects.");
    }
  };

  // 2. Soumission Secrétaire (Étape 2 : Validation OTP)
  const handleSecretaryOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authUser = await verifySecretaryOtp(otpCode);
      setUser(authUser);
      sessionStorage.setItem(SESSION_KEY, "true");
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Code OTP invalide.");
    }
  };

  // 3. Soumission Coach (Mot de passe unique partagé)
  const handleCoachSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authUser = await loginCoach(coachPassword);
      setUser(authUser);
      sessionStorage.setItem(SESSION_KEY, "true");
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Mot de passe incorrect.");
    }
  };

  // 4. Soumission PDG (Mot de passe Maître)
  const handlePdgSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authUser = await loginPdg(pdgEmail, pdgPassword);
      setUser(authUser);
      sessionStorage.setItem(SESSION_KEY, "true");
      setLoading(false);
      onSuccess();
    } catch (err) {
      setLoading(false);
      setError(err.message || "Identifiants PDG invalides.");
    }
  };

  return (
    <div className="w-full">
      {/* Onglets de sélection du rôle */}
      <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl bg-surface p-1 border border-ink/10">
        <button
          type="button"
          onClick={() => {
            setActiveTab("secretaire");
            setError("");
            setOtpStep(false);
          }}
          className={`rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "secretaire"
              ? "bg-white text-ebp-blue shadow-xs"
              : "text-ink/60 hover:text-ink"
          }`}
        >
          Secrétaire
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("coach");
            setError("");
            setOtpStep(false);
          }}
          className={`rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "coach"
              ? "bg-white text-ebp-green shadow-xs"
              : "text-ink/60 hover:text-ink"
          }`}
        >
          Coachs
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("pdg");
            setError("");
            setOtpStep(false);
          }}
          className={`rounded-lg py-2 text-xs font-bold transition-all ${
            activeTab === "pdg"
              ? "bg-white text-ink shadow-xs"
              : "text-ink/60 hover:text-ink"
          }`}
        >
          PDG
        </button>
      </div>

      {/* FORMULAIRE 1 : ESPACE SECRÉTAIRE */}
      {activeTab === "secretaire" && (
        <div className="mt-5">
          {!otpStep ? (
            <form onSubmit={handleSecretarySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink/60 mb-1">Email professionnel</label>
                <input
                  type="email"
                  value={secEmail}
                  onChange={(e) => setSecEmail(e.target.value)}
                  placeholder="josiasdevweb@gmail.com"
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/60 mb-1">Mot de passe</label>
                <div className="relative">
                  <input
                    type={showSecPassword ? "text" : "password"}
                    value={secPassword}
                    onChange={(e) => setSecPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-ink/10 pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecPassword(!showSecPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink transition-colors"
                    aria-label={showSecPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showSecPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <p className="text-xs text-ebp-red-soft">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full shadow-md flex items-center justify-center gap-2"
              >
                {loading ? "Vérification..." : "Demander le code d'accès OTP"}
                <ArrowRight size={14} />
              </button>

              <div className="rounded-lg bg-blue-50/60 p-2.5 text-[11px] text-blue-900 border border-blue-100">
                🔒 <span className="font-semibold">Protocole OTP :</span> La connexion déclenche un code à usage unique
                transmis à la direction (+ journalisation d'audit : Date, Heure, IP, Lieu).
              </div>
            </form>
          ) : (
            <form onSubmit={handleSecretaryOtpSubmit} className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 flex items-center gap-2.5">
                <Mail size={16} className="text-ebp-blue shrink-0" />
                <p className="font-medium text-blue-950 leading-relaxed">
                  Un code d'autorisation a été envoyé par email au PDG.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/60 mb-1">Code de validation OTP (6 chiffres)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Ex : 548912"
                  autoFocus
                  className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-center font-mono text-lg tracking-widest font-bold text-ink focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  required
                />
              </div>

              {error && <p className="text-xs text-ebp-red-soft">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full bg-ebp-green hover:bg-ebp-green-light shadow-md flex items-center justify-center gap-2"
              >
                {loading ? "Vérification OTP..." : "Déverrouiller l'Espace Secrétaire"}
                <CheckCircle2 size={15} />
              </button>

              <button
                type="button"
                onClick={() => setOtpStep(false)}
                className="w-full text-center text-xs text-ink/50 hover:text-ink pt-1"
              >
                ← Revenir aux identifiants
              </button>
            </form>
          )}
        </div>
      )}

      {/* FORMULAIRE 2 : ESPACE COACHS */}
      {activeTab === "coach" && (
        <form onSubmit={handleCoachSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Mot de passe unique partagé</label>
            <div className="relative">
              <input
                type={showCoachPassword ? "text" : "password"}
                value={coachPassword}
                onChange={(e) => setCoachPassword(e.target.value)}
                placeholder="Mot de passe commun aux 6 coachs"
                className="w-full rounded-xl border border-ink/10 pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                required
              />
              <button
                type="button"
                onClick={() => setShowCoachPassword(!showCoachPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink transition-colors"
                aria-label={showCoachPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showCoachPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-ebp-red-soft">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full bg-ebp-green hover:bg-ebp-green-light shadow-md flex items-center justify-center gap-2"
          >
            {loading ? "Connexion..." : "Accéder à l'Espace Coachs (Lecture Seule)"}
            <GraduationCap size={15} />
          </button>

          <div className="rounded-lg bg-emerald-50/60 p-2.5 text-[11px] text-emerald-900 border border-emerald-100">
            📚 <span className="font-semibold">Accès réservé :</span> Consultez votre emploi du temps et les communiqués
            de la direction. Aucun accès aux données financières.
          </div>
        </form>
      )}

      {/* FORMULAIRE 3 : ESPACE PDG */}
      {activeTab === "pdg" && (
        <form onSubmit={handlePdgSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Email Direction</label>
            <input
              type="email"
              value={pdgEmail}
              onChange={(e) => setPdgEmail(e.target.value)}
              placeholder="marcosgroup2002@gmail.com"
              className="w-full rounded-xl border border-ink/10 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink/60 mb-1">Mot de passe Maître</label>
            <div className="relative">
              <input
                type={showPdgPassword ? "text" : "password"}
                value={pdgPassword}
                onChange={(e) => setPdgPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-xl border border-ink/10 pl-3.5 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
                required
              />
              <button
                type="button"
                onClick={() => setShowPdgPassword(!showPdgPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink/40 hover:text-ink transition-colors"
                aria-label={showPdgPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPdgPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-ebp-red-soft">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full shadow-md flex items-center justify-center gap-2"
          >
            {loading ? "Vérification..." : "Accéder à la Supervision & Analytics"}
            <ShieldAlert size={15} />
          </button>

          <div className="rounded-lg bg-slate-100 p-2.5 text-[11px] text-ink/70 border border-ink/10">
            📊 <span className="font-semibold text-ink">Supervision PDG :</span> Validation des OTP, journaux d'audit et
            courbes analytiques de production.
          </div>
        </form>
      )}
    </div>
  );
}

function GateContent({ children }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const { user } = useAdminUser();

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

  if (authed && user) return children;

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

        <GateForm onSuccess={() => setAuthed(true)} />

        <div className="mt-6 flex items-center justify-center gap-2 border-t border-ink/5 pt-4 text-[11px] text-ink/40">
          <ShieldCheck size={14} className="text-ebp-green" />
          <span>Plateforme de production chiffrée · Calavi & Cotonou</span>
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

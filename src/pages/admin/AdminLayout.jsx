import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, Navigate, Link } from "react-router-dom";
import {
  CreditCard,
  ListChecks,
  LogOut,
  ExternalLink,
  GraduationCap,
  TrendingUp,
  ShieldAlert,
  BarChart3,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAdminUser } from "../../context/AdminUserContext";
import { supabase } from "../../lib/supabaseClient";

export default function AdminLayout() {
  const { user, clearUser } = useAdminUser();
  const location = useLocation();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Fermer le drawer lors d'un changement de route
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Verrouiller le défilement arrière-plan quand le drawer mobile est ouvert
  useEffect(() => {
    if (mobileDrawerOpen) {
      document.body.style.overflow = "hidden";
      const onKeyDown = (e) => {
        if (e.key === "Escape") setMobileDrawerOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [mobileDrawerOpen]);

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        //
      }
    }
    sessionStorage.removeItem("ebp_admin_authed");
    clearUser();
    window.location.href = "/admin";
  };

  const role = user?.role || "secretaire";

  // Menu dynamique selon le rôle (Analytics strictly réservé au PDG)
  const navItems = (() => {
    if (role === "coach") {
      return [
        { to: "/admin/coachs", label: "Emploi du temps & Annonces", icon: GraduationCap },
      ];
    }
    if (role === "pdg") {
      return [
        { to: "/admin/analytics", label: "Audience & Clics", icon: BarChart3 },
        { to: "/admin/pdg", label: "Supervision Générale", icon: TrendingUp },
        { to: "/admin/paiements", label: "Suivi Apprenants (Lecture)", icon: CreditCard },
        { to: "/admin/audit", label: "Journaux d'Audit", icon: ShieldAlert },
        { to: "/admin/coachs", label: "Aperçu Espace Coachs", icon: GraduationCap },
      ];
    }
    // Secrétaire par défaut (Pas d'accès Analytics)
    return [
      { to: "/admin/paiements", label: "Paiements & Apprenants", icon: CreditCard },
      { to: "/admin/checklists", label: "Checklists Secrétariat", icon: ListChecks },
    ];
  })();

  // Vérification de sécurité des accès par rôle
  const pathname = location.pathname;
  if (role === "coach" && (pathname.includes("/admin/paiements") || pathname.includes("/admin/checklists") || pathname.includes("/admin/pdg") || pathname.includes("/admin/audit") || pathname.includes("/admin/analytics"))) {
    return <Navigate to="/admin/coachs" replace />;
  }
  if (role === "secretaire" && (pathname.includes("/admin/pdg") || pathname.includes("/admin/audit") || pathname.includes("/admin/analytics"))) {
    return <Navigate to="/admin/paiements" replace />;
  }

  const roleBadge = (() => {
    if (role === "pdg") return { label: "Direction Générale (PDG)", color: "bg-purple-100 text-purple-800" };
    if (role === "coach") return { label: "Corps Enseignant (Coach)", color: "bg-emerald-100 text-emerald-800" };
    return { label: "Exploitation (Secrétaire)", color: "bg-blue-100 text-blue-800" };
  })();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar Desktop Fixe */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink/10 bg-white p-5 lg:flex">
        <div className="flex items-center gap-2.5 px-1">
          <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-9 w-auto rounded-md shadow-xs" />
          <div>
            <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">EBP Admin</span>
            <span className="block text-[10px] text-ink/40 font-medium">Portail Sécurisé</span>
          </div>
        </div>

        {/* Profil utilisateur connecté */}
        {user && (
          <div className="mt-6 rounded-xl bg-surface p-3.5 border border-ink/5">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ebp-blue text-white font-bold text-xs">
                {user.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-ink">{user.name}</p>
                <span className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${roleBadge.color}`}>
                  {roleBadge.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Desktop */}
        <nav className="mt-6 flex flex-1 flex-col gap-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-ebp-blue text-white shadow-sm"
                    : "text-ink/65 hover:bg-surface hover:text-ink"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Pied de navigation Desktop */}
        <div className="border-t border-ink/5 pt-4 space-y-1">
          <a
            href="/"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink/50 hover:bg-surface hover:text-ink transition-colors"
          >
            <ExternalLink size={14} />
            Voir le site public
          </a>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-semibold text-ebp-red-soft hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Zone de contenu principale */}
      <div className="min-w-0 flex-1 flex flex-col min-h-screen">
        {/* BARRE SUPÉRIEURE MOBILE AVEC BOUTON HAMBURGER */}
        <header className="flex h-16 items-center justify-between border-b border-ink/10 bg-white px-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-8 w-auto rounded-md shadow-xs shrink-0" />
            <div className="min-w-0">
              <span className="block font-display text-xs font-bold text-ink truncate">EBP Admin</span>
              <span className={`inline-block rounded px-1.5 py-0.2 text-[8px] font-bold ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
            </div>
          </div>

          {/* Bouton Hamburger Mobile (touch-friendly min 44x44px) */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            aria-label="Ouvrir le menu d'administration"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-ebp-blue hover:bg-slate-200 active:scale-95 transition-all shrink-0"
          >
            <Menu size={22} />
          </button>
        </header>

        {/* OVERLAY SOMBRE AVEC BACKDROP-BLUR POUR L'ESPACE ADMIN */}
        <div
          className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            mobileDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden={!mobileDrawerOpen}
        />

        {/* MENU LATÉRAL DROIT (DRAWER) SLIDE-IN DANS L'ADMIN */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out transform lg:hidden ${
            mobileDrawerOpen ? "translate-x-0" : "translate-x-full"
          }`}
          aria-label="Menu administration mobile"
        >
          {/* En-tête du drawer */}
          <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5">
            <div className="flex items-center gap-2.5">
              <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-8 w-auto rounded-md shadow-xs" />
              <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
                Menu Admin
              </span>
            </div>

            {/* Bouton de fermeture "X" */}
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Fermer le menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-ink/70 hover:bg-slate-200 hover:text-ink active:scale-90 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profil connecté dans le drawer */}
          {user && (
            <div className="p-4 border-b border-ink/5 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ebp-blue text-white font-bold text-xs shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{user.name}</p>
                  <span className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Liens de navigation Admin verticaux espacés au toucher */}
          <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-ebp-blue text-white shadow-sm"
                      : "text-ink/75 hover:bg-slate-50 hover:text-ebp-blue"
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon size={17} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight size={15} className="opacity-50" />
              </NavLink>
            ))}
          </nav>

          {/* Actions de bas de drawer */}
          <div className="border-t border-ink/10 p-4 space-y-2 bg-slate-50/50">
            <a
              href="/"
              onClick={() => setMobileDrawerOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-white border border-ink/10 px-4 py-2.5 text-xs font-medium text-ink hover:bg-surface transition-colors"
            >
              <ExternalLink size={14} />
              Voir le site public
            </a>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-bold text-ebp-red-soft hover:bg-red-100 active:scale-95 transition-all"
            >
              <LogOut size={14} />
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu principal de la vue Admin */}
        <main className="p-3.5 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

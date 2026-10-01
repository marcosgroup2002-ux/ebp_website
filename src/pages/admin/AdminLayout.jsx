import { NavLink, Outlet, useLocation, Navigate } from "react-router-dom";
import {
  CreditCard,
  ListChecks,
  LogOut,
  ExternalLink,
  GraduationCap,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { useAdminUser } from "../../context/AdminUserContext";
import { supabase } from "../../lib/supabaseClient";

export default function AdminLayout() {
  const { user, clearUser } = useAdminUser();
  const location = useLocation();

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

  // Menu dynamique selon le rôle
  const navItems = (() => {
    if (role === "coach") {
      return [
        { to: "/admin/coachs", label: "Emploi du temps & Annonces", icon: GraduationCap },
      ];
    }
    if (role === "pdg") {
      return [
        { to: "/admin/pdg", label: "Supervision & Analytics", icon: TrendingUp },
        { to: "/admin/paiements", label: "Suivi Apprenants (Lecture)", icon: CreditCard },
        { to: "/admin/audit", label: "Journaux d'Audit", icon: ShieldAlert },
        { to: "/admin/coachs", label: "Aperçu Espace Coachs", icon: GraduationCap },
      ];
    }
    // Secrétaire par défaut
    return [
      { to: "/admin/paiements", label: "Paiements & Apprenants", icon: CreditCard },
      { to: "/admin/checklists", label: "Checklists Secrétariat", icon: ListChecks },
    ];
  })();

  // Vérification de sécurité des accès par rôle
  const pathname = location.pathname;
  if (role === "coach" && (pathname.includes("/admin/paiements") || pathname.includes("/admin/checklists") || pathname.includes("/admin/pdg") || pathname.includes("/admin/audit"))) {
    return <Navigate to="/admin/coachs" replace />;
  }
  if (role === "secretaire" && (pathname.includes("/admin/pdg") || pathname.includes("/admin/audit"))) {
    return <Navigate to="/admin/paiements" replace />;
  }

  const roleBadge = (() => {
    if (role === "pdg") return { label: "Direction Générale (PDG)", color: "bg-purple-100 text-purple-800" };
    if (role === "coach") return { label: "Corps Enseignant (Coach)", color: "bg-emerald-100 text-emerald-800" };
    return { label: "Exploitation (Secrétaire)", color: "bg-blue-100 text-blue-800" };
  })();

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar Desktop */}
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

        {/* Navigation */}
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

        {/* Pied de navigation */}
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

      {/* Zone de contenu */}
      <div className="min-w-0 flex-1">
        {/* Barre mobile */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-7 w-auto rounded-md" />
            <span className="font-display text-xs font-bold text-ink">{roleBadge.label}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1.5 font-semibold ${
                    isActive ? "bg-ebp-blue text-white" : "text-ink/60 hover:text-ink"
                  }`
                }
              >
                {item.label.split(" ")[0]}
              </NavLink>
            ))}
            <button onClick={logout} className="p-1.5 text-ebp-red-soft">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Contenu de la vue */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

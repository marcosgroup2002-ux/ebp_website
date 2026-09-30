import { NavLink, Outlet } from "react-router-dom";
import { CreditCard, ListChecks, LogOut, ExternalLink } from "lucide-react";
import { useAdminUser } from "../../context/AdminUserContext";

import { supabase } from "../../lib/supabaseClient";

const NAV = [
  { to: "/admin/paiements", label: "Paiements", icon: CreditCard },
  { to: "/admin/checklists", label: "Checklists", icon: ListChecks },
];

export default function AdminLayout() {
  const { user, clearUser } = useAdminUser();

  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignorer les erreurs réseau lors de la déconnexion
      }
    }
    sessionStorage.removeItem("ebp_admin_authed");
    clearUser();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-ink/10 bg-white p-5 lg:flex">
        <div className="flex items-center gap-2 px-1">
          <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-9 w-auto rounded-md" />
          <span className="font-display text-xs font-bold uppercase tracking-wide text-ink/40">Admin</span>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? "bg-ebp-blue/10 text-ebp-blue" : "text-ink/60 hover:bg-surface"
                }`
              }
            >
              <item.icon size={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {user && (
          <div className="mb-2 rounded-lg bg-surface px-3 py-2.5">
            <p className="text-xs font-semibold text-ink">{user.name}</p>
            <p className="text-[11px] text-ink/50">{user.role}</p>
          </div>
        )}
        <a href="/" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-ink/50 hover:bg-surface">
          <ExternalLink size={15} />
          Voir le site public
        </a>
        <button
          onClick={logout}
          className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-ebp-red-soft hover:bg-red-50"
        >
          <LogOut size={15} />
          Se déconnecter
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Barre mobile */}
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-white px-4 py-3 lg:hidden">
          <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-8 w-auto shrink-0 rounded-md" />
          <div className="flex min-w-0 items-center gap-3 text-sm text-ink/60">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className="whitespace-nowrap hover:text-ebp-blue">
                {item.label}
              </NavLink>
            ))}
            <button onClick={logout} aria-label="Se déconnecter" className="text-ebp-red-soft">
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

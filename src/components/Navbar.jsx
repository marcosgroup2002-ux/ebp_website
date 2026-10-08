import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, MessageCircle, ChevronRight, Phone } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import { WHATSAPP_DISPLAY } from "../data/siteContent";
import AnnouncementBar from "./AnnouncementBar";

const NAV_ITEMS = [
  { label: "Accueil", to: "/" },
  { label: "Programme (6 Mois)", to: "/#programme" },
  { label: "Formats & Tarifs", to: "/#formats" },
  { label: "À propos", to: "/a-propos" },
  { label: "Blog & Astuces", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const onKeyDown = (e) => {
        if (e.key === "Escape") setOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", onKeyDown);
      };
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  return (
    <>

      <header
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 shadow-xs backdrop-blur-md border-b border-ink/5"
            : "bg-white/80 backdrop-blur-sm"
        }`}
      >
        <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          <Link to="/" className="flex items-center gap-2.5 shrink-0" aria-label="EBP Accueil">
            <img
              src="/brand/ebp-logo.jpg"
              alt="EBP - English for Busy People"
              className="h-9 sm:h-11 w-auto rounded-lg shadow-xs"
            />
          </Link>

          <nav className="hidden items-center gap-6 xl:gap-8 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `text-xs lg:text-sm font-semibold transition-colors hover:text-ebp-blue ${
                    isActive ? "text-ebp-blue font-bold" : "text-ink/75"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelTest)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-ebp-green px-5 py-2.5 text-xs lg:text-sm font-semibold text-white shadow-sm transition-all hover:bg-ebp-green-light active:scale-95"
            >
              <MessageCircle size={16} />
              Test de Niveau
            </a>
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-ebp-blue hover:bg-slate-200 active:scale-95 transition-all lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu de navigation"
            aria-expanded={open}
          >
            <Menu size={24} />
          </button>
        </div>
        <AnnouncementBar />
      </header>

      <div
        className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out transform lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Menu mobile"
      >

        <div className="flex h-16 sm:h-20 items-center justify-between border-b border-ink/10 px-5">
          <div className="flex items-center gap-2.5">
            <img
              src="/brand/ebp-logo.jpg"
              alt="EBP"
              className="h-8 w-auto rounded-md shadow-xs"
            />
            <span className="font-display text-xs font-bold uppercase tracking-wider text-ink">
              Navigation
            </span>
          </div>

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-ink/70 hover:bg-slate-200 hover:text-ink active:scale-90 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-4 py-3.5 text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-ebp-blue text-white shadow-sm"
                    : "text-ink/80 hover:bg-slate-50 hover:text-ebp-blue"
                }`
              }
            >
              <span>{item.label}</span>
              <ChevronRight size={16} className="opacity-60" />
            </NavLink>
          ))}
        </div>

        <div className="border-t border-ink/10 p-5 space-y-3 bg-slate-50/50">
          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelTest)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-ebp-green px-5 py-3.5 text-sm font-bold text-white shadow-md active:scale-95 transition-all hover:bg-ebp-green-light"
          >
            <MessageCircle size={18} />
            Passer le Test de Niveau
          </a>

          <a
            href="tel:+2290196840296"
            className="flex w-full items-center justify-center gap-2 text-xs font-semibold text-ink/70 hover:text-ebp-blue py-1"
          >
            <Phone size={14} />
            <span>Assistance : {WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </aside>
    </>
  );
}

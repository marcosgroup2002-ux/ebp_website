import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link, NavLink } from "react-router-dom";
import { Menu, X, MessageCircle } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";

const NAV_ITEMS = [
  { label: "Accueil", to: "/" },
  { label: "Programme", to: "/#programme" },
  { label: "À propos", to: "/a-propos" },
  { label: "Blog", to: "/blog" },
  { label: "Contact", to: "/contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Verrouille le scroll du body et permet de fermer le tiroir avec Échap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 shadow-soft backdrop-blur-md" : "bg-white/60 backdrop-blur-sm"
        }`}
      >
        <nav className="container flex h-20 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/brand/ebp-logo.jpg" alt="EBP · English for Busy People" className="h-11 w-auto rounded-md" />
          </Link>

          <div className="hidden items-center gap-7 lg:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors hover:text-ebp-blue ${
                    isActive ? "text-ebp-blue" : "text-ink/70"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>

          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelTest)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-2 rounded-full bg-ebp-green px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(0,135,61,0.6)] transition-all hover:bg-ebp-green-light active:scale-[0.98] lg:inline-flex"
          >
            <MessageCircle size={16} />
            Test de Niveau
          </a>

          <button
            className="rounded-lg p-2 text-ebp-blue lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
          >
            <Menu size={24} />
          </button>
        </nav>
      </header>

      {/*
        Tiroir de navigation mobile, rendu via un portail dans document.body.
        Nécessaire : le <header> ci-dessus utilise backdrop-blur (backdrop-filter),
        qui crée un nouveau bloc de positionnement pour ses descendants en
        `position: fixed` dans Chromium/WebKit. Sans ce portail, le tiroir se
        positionnerait par rapport au header (~80px de haut) au lieu du viewport
        entier, et ne couvrirait donc qu'une petite boîte en haut de l'écran.
      */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                key="drawer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
                className="fixed inset-y-0 right-0 z-50 flex w-[82%] max-w-xs flex-col bg-white shadow-2xl lg:hidden"
              >
                <div className="flex h-20 items-center justify-between border-b border-ink/10 px-5">
                  <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-9 w-auto rounded-md" />
                  <button
                    onClick={() => setOpen(false)}
                    aria-label="Fermer le menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-ink/50 hover:bg-surface hover:text-ink"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5">
                  {NAV_ITEMS.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      end={item.to === "/"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        `rounded-lg px-3 py-3.5 text-base font-medium hover:bg-surface ${
                          isActive ? "text-ebp-blue" : "text-ink/80"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>

                <div className="border-t border-ink/10 p-4">
                  <a
                    href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelTest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full"
                  >
                    <MessageCircle size={16} />
                    Passer le Test de Niveau
                  </a>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

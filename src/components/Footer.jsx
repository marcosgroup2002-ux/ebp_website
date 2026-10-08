import { Link } from "react-router-dom";
import { MessageCircle, MapPin, Mail, Navigation } from "lucide-react";
import { WHATSAPP_DISPLAY, CONTACT_INFO, mapsDirectionsLink } from "../data/siteContent";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";

function InstagramGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookGlyph(props) {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M14 8.5h2V5h-2.2C11.7 5 10 6.6 10 9v2.2H8V15h2v6h3v-6h2.3l.7-3.8H13V9c0-.3.3-.5.7-.5H14z" />
    </svg>
  );
}

const FOOTER_LINKS = {
  Programme: [
    { label: "Programme 6 Mois", to: "/#programme" },
    { label: "Formats & Villes", to: "/#formats" },
    { label: "Tarifs & Paiements", to: "/#tarifs" },
  ],
  École: [
    { label: "À propos", to: "/a-propos" },
    { label: "Blog", to: "/blog" },
    { label: "Contact", to: "/contact" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-ink pt-16 text-white/70">
      <div className="container grid gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-11 w-auto rounded-md bg-white p-1" />
          <p className="mt-4 max-w-xs text-sm text-white/50">
            English for Busy People, centre d'apprentissage de l'anglais accéléré pour professionnels,
            cadres, entrepreneurs et étudiants.
          </p>
          <div className="mt-5 flex items-center gap-2 text-sm text-white/60">
            <MapPin size={15} className="text-ebp-green-light" />
            Cotonou (Vedoko) · Calavi (Zogbadjè) · En Ligne
          </div>
          <a
            href={`mailto:${CONTACT_INFO.email}`}
            className="mt-2 flex items-center gap-2 break-all text-sm text-white/60 hover:text-white"
          >
            <Mail size={15} className="shrink-0 text-ebp-green-light" />
            {CONTACT_INFO.email}
          </a>
          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.general)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-ebp-green-light hover:text-white"
          >
            <MessageCircle size={15} />
            {WHATSAPP_DISPLAY}
          </a>
        </div>

        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div key={title}>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{title}</p>
            <ul className="mt-4 space-y-2.5">
              {links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm text-white/60 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Suivez-nous</p>
          <div className="mt-4 flex items-center gap-4">
            <a href="#" aria-label="Instagram" className="text-white/50 hover:text-white">
              <InstagramGlyph />
            </a>
            <a href="#" aria-label="Facebook" className="text-white/50 hover:text-white">
              <FacebookGlyph />
            </a>
          </div>
        </div>
      </div>

      <div className="container pb-12">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Nos centres</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {CONTACT_INFO.centers.map((center) => (
            <a
              key={center.id}
              href={mapsDirectionsLink(center.coordinates)}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition-colors hover:border-ebp-green-light/60 hover:bg-white/10"
            >
              <span className="flex min-w-0 items-center gap-3">
                <MapPin size={18} className="shrink-0 text-ebp-green-light" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-white">{center.name}</span>
                  <span className="block truncate text-xs text-white/50">{center.address}</span>
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ebp-green px-3.5 py-2 text-xs font-semibold text-white group-hover:bg-ebp-green-light">
                <Navigation size={13} />
                Itinéraire
              </span>
            </a>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-xs text-white/40">© 2026 EBP · English for Busy People. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}

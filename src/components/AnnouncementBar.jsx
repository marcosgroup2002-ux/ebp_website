import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, CalendarDays, Sparkles, MapPin, Monitor } from "lucide-react";
import { NEXT_COHORT_DATE, NEXT_COHORT_ISO } from "../data/siteContent";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";

// La clé dépend de la date de rentrée : un bandeau fermé réapparaît à la rentrée suivante.
const DISMISS_KEY = `ebp_announcement_closed_${NEXT_COHORT_ISO}`;

function daysUntil(isoDate) {
  const target = new Date(`${isoDate}T00:00:00+01:00`);
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    return false;
  }
}

function TickerItems({ countdown }) {
  return (
    <>
      <span className="inline-flex items-center gap-2">
        <CalendarDays size={14} className="text-ebp-green-light" />
        Prochaine rentrée : <strong className="font-bold text-white">{NEXT_COHORT_DATE}</strong>
      </span>
      <Sparkles size={12} className="text-white/40" />
      <span className="inline-flex items-center gap-2">
        Inscriptions ouvertes
        {countdown > 0 && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[11px] font-bold text-ebp-green-light ring-1 ring-ebp-green-light/40">
            J-{countdown}
          </span>
        )}
      </span>
      <Sparkles size={12} className="text-white/40" />
      <span className="inline-flex items-center gap-2">
        <MapPin size={14} className="text-ebp-green-light" />
        Cotonou (Vedoko) · Calavi (Zogbadjè)
      </span>
      <Sparkles size={12} className="text-white/40" />
      <span className="inline-flex items-center gap-2">
        <Monitor size={14} className="text-ebp-green-light" />
        Aussi en ligne via Google Meet
      </span>
      <Sparkles size={12} className="text-white/40" />
      <span>Places limitées : réservez la vôtre dès maintenant</span>
      <Sparkles size={12} className="text-white/40" />
    </>
  );
}

export default function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(readDismissed);
  const countdown = daysUntil(NEXT_COHORT_ISO);

  if (dismissed || countdown < 0) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Stockage indisponible : le bandeau restera simplement fermé pour cette visite.
    }
  };

  return (
    <div className="relative overflow-hidden bg-[#050b24] text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-glowShift bg-[linear-gradient(90deg,rgba(0,43,154,0.55),rgba(22,163,74,0.35),rgba(220,38,38,0.35),rgba(0,43,154,0.55))] bg-[length:300%_100%]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-ebp-green-light/70 to-transparent" />

      <div className="relative mx-auto flex h-10 max-w-7xl items-center gap-2 px-2 sm:gap-3 sm:px-6 lg:px-8">
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ring-white/20 backdrop-blur-sm sm:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ebp-green-light opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ebp-green-light" />
          </span>
          Rentrée
        </span>

        <Link
          to="/contact"
          className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]"
          aria-label={`Prochaine rentrée le ${NEXT_COHORT_DATE}, inscriptions ouvertes. Nous contacter.`}
        >
          <div className="flex w-max animate-marquee items-center whitespace-nowrap text-xs font-medium text-white/85 group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:text-[13px]">
            <span className="flex items-center gap-6 pr-6">
              <TickerItems countdown={countdown} />
            </span>
            <span aria-hidden="true" className="flex items-center gap-6 pr-6">
              <TickerItems countdown={countdown} />
            </span>
          </div>
        </Link>

        <a
          href={buildWhatsAppLink(WHATSAPP_MESSAGES.enroll)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-ebp-green to-emerald-400 px-3 py-1.5 text-[11px] font-bold text-white shadow-[0_0_18px_rgba(34,197,94,0.55)] transition hover:brightness-110 sm:text-xs"
        >
          S'inscrire
          <ArrowRight size={13} />
        </a>
        <Link
          to="/contact"
          className="hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white/80 ring-1 ring-white/25 transition hover:bg-white/10 hover:text-white md:inline-flex"
        >
          Contact
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer l'annonce"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

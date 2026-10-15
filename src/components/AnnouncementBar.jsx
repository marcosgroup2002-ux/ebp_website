import { useState } from "react";
import { Link } from "react-router-dom";
import { X, ArrowRight, CalendarDays, MapPin, Monitor } from "lucide-react";
import { NEXT_COHORT_DATE, NEXT_COHORT_ISO } from "../data/siteContent";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";

// Un bandeau fermé réapparaît 2 jours plus tard, ou dès que la date de rentrée change.
const DISMISS_KEY = `ebp_announcement_closed_${NEXT_COHORT_ISO}`;
const HIDE_DURATION_MS = 2 * 24 * 60 * 60 * 1000;

function daysUntil(isoDate) {
  const target = new Date(`${isoDate}T00:00:00+01:00`);
  return Math.ceil((target.getTime() - Date.now()) / 86400000);
}

function readDismissed() {
  try {
    const closedAt = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(closedAt) && Date.now() - closedAt < HIDE_DURATION_MS;
  } catch {
    return false;
  }
}

function TickerItems({ countdown }) {
  return (
    <>
      <span className="inline-flex items-center gap-2">
        <CalendarDays size={14} className="text-white/90" />
        Prochaine rentrée : <strong className="font-bold text-white">{NEXT_COHORT_DATE}</strong>
      </span>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
      <span className="inline-flex items-center gap-2">
        Inscriptions ouvertes
        {countdown > 0 && (
          <span className="rounded-full bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-ebp-red">
            J-{countdown}
          </span>
        )}
      </span>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
      <span className="inline-flex items-center gap-2">
        <MapPin size={14} className="text-white/90" />
        Cotonou (Vedoko) · Calavi (Zogbadjè)
      </span>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
      <span className="inline-flex items-center gap-2">
        <Monitor size={14} className="text-white/90" />
        Aussi en ligne via Google Meet
      </span>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
      <span>Places limitées : réservez la vôtre dès maintenant</span>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/50" />
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
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Stockage indisponible : le bandeau restera simplement fermé pour cette visite.
    }
  };

  return (
    <div className="relative overflow-hidden bg-ebp-red text-white">
      <div
        aria-hidden="true"
        className="absolute inset-0 animate-glowShift bg-[linear-gradient(90deg,#E50914,#B80710,#E50914,#F0353E,#E50914)] bg-[length:300%_100%]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

      <div className="relative mx-auto flex h-10 max-w-7xl items-center gap-2 px-2 sm:gap-3 sm:px-6 lg:px-8">
        <span className="hidden shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ring-1 ring-white/30 sm:inline-flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Rentrée
        </span>

        <Link
          to="/contact"
          className="group relative min-w-0 flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_6%,black_94%,transparent)]"
          aria-label={`Prochaine rentrée le ${NEXT_COHORT_DATE}, inscriptions ouvertes. Nous contacter.`}
        >
          <div className="flex w-max animate-marquee items-center whitespace-nowrap text-xs font-medium text-white group-hover:[animation-play-state:paused] motion-reduce:animate-none sm:text-[13px]">
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
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-ebp-red shadow-sm transition hover:bg-white/90 sm:text-xs"
        >
          S'inscrire
          <ArrowRight size={13} />
        </a>
        <Link
          to="/contact"
          className="hidden shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/50 transition hover:bg-white/15 md:inline-flex"
        >
          Contact
        </Link>
        <button
          type="button"
          onClick={close}
          aria-label="Fermer l'annonce"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

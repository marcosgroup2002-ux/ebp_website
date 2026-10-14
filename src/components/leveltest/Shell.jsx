import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Clock } from "lucide-react";

const BLOBS = [
  { className: "-left-32 -top-24 h-72 w-72 bg-ebp-blue/15", delay: 0 },
  { className: "-right-24 top-1/3 h-80 w-80 bg-sky-300/30", delay: 1.4 },
  { className: "-bottom-32 left-1/4 h-72 w-72 bg-ebp-blue/10", delay: 2.8 },
];

export function useCountdown(expiresAt, active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [active]);
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function TimerPill({ secondsLeft }) {
  if (secondsLeft === null) return null;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const tone =
    secondsLeft <= 60
      ? "bg-red-50 text-ebp-red-soft ring-red-200"
      : secondsLeft <= 300
      ? "bg-amber-50 text-amber-700 ring-amber-200"
      : "bg-white text-ebp-blue ring-ebp-blue/15";
  return (
    <span
      role="timer"
      aria-label={`Temps restant : ${minutes} minutes et ${seconds} secondes`}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold tabular-nums shadow-sm ring-1 transition-colors ${tone}`}
    >
      <Clock size={13} />
      {minutes}:{seconds}
    </span>
  );
}

export default function Shell({ children, right }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative min-h-[100dvh] overflow-x-hidden bg-[#F3F6FF] text-ink">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {BLOBS.map((blob, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full blur-3xl ${blob.className}`}
            animate={reduce ? undefined : { y: [0, -24, 0], x: [0, 14, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: blob.delay }}
          />
        ))}
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pb-2 pt-4 sm:pt-6">
        <Link to="/" aria-label="Retour à l'accueil EBP" className="shrink-0">
          <img src="/brand/ebp-logo.jpg" alt="EBP" className="h-9 w-auto rounded-lg shadow-sm sm:h-11" />
        </Link>
        <div className="flex items-center gap-2">{right}</div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-36 pt-2 sm:pb-16">{children}</main>
    </div>
  );
}

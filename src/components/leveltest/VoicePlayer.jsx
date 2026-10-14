import { useCallback, useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, Rewind } from "lucide-react";
import { AUDIOS } from "../../data/levelTest";

const BARS = 36;
const SPEEDS = [1, 0.85, 0.7];

function fmt(seconds) {
  if (!Number.isFinite(seconds)) return "0:00";
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Lecteur « assistant vocal » : orbe qui réagit à la voix, onde en direct, réécoute illimitée.
export default function VoicePlayer({ audioId }) {
  const audio = AUDIOS[audioId];
  const mediaRef = useRef(null);
  const orbRef = useRef(null);
  const barsRef = useRef([]);
  const ctxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafRef = useRef(0);
  const [status, setStatus] = useState("idle"); // idle | loading | playing | paused | ended | error
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speedIndex, setSpeedIndex] = useState(0);
  const [plays, setPlays] = useState(0);
  const retriesRef = useRef(0);

  const stopLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    if (orbRef.current) orbRef.current.style.transform = "";
    barsRef.current.forEach((bar) => bar && (bar.style.transform = "scaleY(0.12)"));
  }, []);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const analyser = analyserRef.current;
    const data = analyser ? new Uint8Array(analyser.frequencyBinCount) : null;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const tick = (now) => {
      let level = 0;
      if (analyser) {
        analyser.getByteFrequencyData(data);
        const step = Math.max(1, Math.floor((data.length * 0.6) / BARS));
        barsRef.current.forEach((bar, i) => {
          if (!bar) return;
          const v = data[i * step] / 255;
          level += v;
          bar.style.transform = `scaleY(${reduce ? 0.3 : Math.max(0.12, Math.min(1, v * 1.25))})`;
        });
        level /= BARS;
      } else {
        // Sans analyse audio (navigateur limité) : pulsation douce simulée.
        const t = now / 1000;
        barsRef.current.forEach((bar, i) => {
          if (bar) bar.style.transform = `scaleY(${reduce ? 0.3 : 0.25 + 0.2 * Math.abs(Math.sin(t * 3 + i * 0.6))})`;
        });
        level = 0.25;
      }
      if (orbRef.current && !reduce) orbRef.current.style.transform = `scale(${1 + Math.min(0.22, level * 0.55)})`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(
    () => () => {
      stopLoop();
      mediaRef.current?.pause();
      ctxRef.current?.close?.().catch(() => {});
    },
    [stopLoop]
  );

  // Contexte audio créé au premier geste (obligatoire sur iPhone).
  const ensureAnalyser = () => {
    if (ctxRef.current || !mediaRef.current) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const source = ctx.createMediaElementSource(mediaRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      analyserRef.current = null;
    }
  };

  const play = async () => {
    const el = mediaRef.current;
    if (!el) return;
    ensureAnalyser();
    try {
      await ctxRef.current?.resume?.();
      if (status === "ended") el.currentTime = 0;
      setStatus((s) => (s === "paused" || s === "ended" ? s : "loading"));
      await el.play();
    } catch {
      setStatus("error");
    }
  };

  const toggle = () => (status === "playing" ? mediaRef.current?.pause() : play());

  const replay = () => {
    const el = mediaRef.current;
    if (!el) return;
    el.currentTime = 0;
    play();
  };

  const back = () => {
    const el = mediaRef.current;
    if (el) el.currentTime = Math.max(0, el.currentTime - 5);
  };

  const cycleSpeed = () => {
    const next = (speedIndex + 1) % SPEEDS.length;
    setSpeedIndex(next);
    if (mediaRef.current) mediaRef.current.playbackRate = SPEEDS[next];
  };

  const seek = (e) => {
    const el = mediaRef.current;
    if (el && duration) el.currentTime = (Number(e.target.value) / 1000) * duration;
  };

  const label = {
    idle: "Appuyez pour écouter l'enregistrement",
    loading: "Chargement de l'audio…",
    playing: "Écoute en cours…",
    paused: "En pause",
    ended: plays > 1 ? "Terminé · vous pouvez réécouter" : "Terminé · réécoutez si besoin",
    error: "Lecture impossible. Vérifiez votre connexion puis réessayez.",
  }[status];

  const active = status === "playing";
  const pill =
    "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-xs font-semibold hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white";

  return (
    <section
      aria-label={audio.title}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#001B6B] via-[#002B9A] to-[#1E5BE6] p-5 text-white shadow-[0_24px_50px_-24px_rgba(0,27,107,0.9)]"
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <p className="relative flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
        <Headphones size={14} />
        {audio.title}
      </p>

      <div className="relative mt-5 flex flex-col items-center">
        <div className="relative flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
          {active && (
            <>
              <span aria-hidden className="absolute inset-0 rounded-full border border-white/40 animate-orbRipple" />
              <span aria-hidden className="absolute inset-0 rounded-full border border-white/30 animate-orbRipple [animation-delay:1.3s]" />
            </>
          )}
          <div ref={orbRef} className="absolute inset-0 transition-transform duration-75 will-change-transform">
            <div
              className={`h-full w-full rounded-full bg-[radial-gradient(circle_at_30%_25%,#ffffff_0%,#9CC3FF_38%,#3F7DF0_72%,#1E5BE6_100%)] shadow-[0_0_60px_8px_rgba(120,170,255,0.55)] ${
                active ? "" : "animate-orbBreath"
              }`}
            />
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={active ? "Mettre en pause" : "Écouter"}
            className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-white text-ebp-blue shadow-lg transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          >
            {active ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" className="translate-x-0.5" />}
          </button>
        </div>

        <div aria-hidden className="mt-5 flex h-10 w-full max-w-sm items-center justify-center gap-[3px]">
          {Array.from({ length: BARS }, (_, i) => (
            <span
              key={i}
              ref={(el) => (barsRef.current[i] = el)}
              className="h-full w-[3px] origin-center rounded-full bg-white/80 transition-transform duration-75"
              style={{ transform: "scaleY(0.12)" }}
            />
          ))}
        </div>

        <p role="status" aria-live="polite" className="mt-2 text-sm font-medium text-white/90">
          {label}
        </p>
      </div>

      <div className="relative mt-4">
        <input
          type="range"
          min="0"
          max="1000"
          value={duration ? Math.round((time / duration) * 1000) : 0}
          onChange={seek}
          aria-label="Position dans l'enregistrement"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/25 accent-white"
        />
        <div className="mt-1 flex justify-between text-[11px] tabular-nums text-white/70">
          <span>{fmt(time)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className="relative mt-3 flex items-center justify-center gap-2">
        <button type="button" onClick={back} className={pill}>
          <Rewind size={14} /> −5 s
        </button>
        <button type="button" onClick={replay} className={pill}>
          <RotateCcw size={14} /> Réécouter
        </button>
        <button type="button" onClick={cycleSpeed} aria-label={`Vitesse ${SPEEDS[speedIndex]}`} className={`${pill} tabular-nums`}>
          {SPEEDS[speedIndex]}×
        </button>
      </div>

      <p className="relative mt-4 text-center text-[11px] text-white/60">Réécoute illimitée</p>

      <audio
        ref={mediaRef}
        src={audio.src}
        preload="metadata"
        playsInline
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onWaiting={() => setStatus((s) => (s === "playing" ? "loading" : s))}
        onPlaying={() => {
          retriesRef.current = 0;
          setStatus("playing");
          startLoop();
        }}
        onPlay={() => setPlays((n) => n + 1)}
        onPause={(e) => {
          stopLoop();
          if (!e.currentTarget.ended) setStatus("paused");
        }}
        onEnded={() => {
          stopLoop();
          setStatus("ended");
        }}
        onError={(e) => {
          // Coupure réseau en cours de lecture : on recharge et on reprend là où l'on en était.
          const el = e.currentTarget;
          if (retriesRef.current < 2) {
            retriesRef.current += 1;
            const resumeAt = el.currentTime;
            el.load();
            el.addEventListener(
              "loadedmetadata",
              () => {
                el.currentTime = resumeAt;
                el.play().catch(() => setStatus("error"));
              },
              { once: true }
            );
            return;
          }
          stopLoop();
          setStatus("error");
        }}
      />
    </section>
  );
}

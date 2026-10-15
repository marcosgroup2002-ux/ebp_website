import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Headphones,
  MessageCircle,
  Play,
} from "lucide-react";
import { NEXT_COHORT_DATE, SEATS_LEFT, SESSION_STEPS, TEST_LEVEL_URL, YOUTUBE_CHANNEL_URL } from "../data/siteContent";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import Waveform from "./Waveform";

function YoutubeGlyph({ size = 18, className = "" }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <rect x="1.5" y="5" width="21" height="14" rx="4.5" fill="currentColor" />
      <path d="M10 9v6l5.2-3z" fill="#fff" />
    </svg>
  );
}

// Même famille de bleus que la section des 4 piliers.
const TONES = ["#002B9A", "#1E5BE6", "#001B6B", "#0F6FD6", "#002B9A", "#1E5BE6", "#001B6B"];

const SWIPE_THRESHOLD = 40;
const SLIDE = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease";

const TOTAL_MINUTES = SESSION_STEPS.reduce((sum, s) => sum + s.minutes, 0);
const TOTAL_LABEL = `${Math.floor(TOTAL_MINUTES / 60)} h ${String(TOTAL_MINUTES % 60).padStart(2, "0")}`;

function placement(index, active, count) {
  const offset = (index - active + count) % count;
  if (offset === 0) return 0;
  return offset === count - 1 ? -1 : 1;
}

function embedUrl(video) {
  const src = video.playlist
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${video.playlist}&`
    : `https://www.youtube-nocookie.com/embed/${video.id}?`;
  return `${src}autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

function Thumb({ video, eager = false }) {
  const [fallback, setFallback] = useState(false);
  const name = video.vertical || fallback ? "hqdefault" : "maxresdefault";
  return (
    <img
      src={`https://i.ytimg.com/vi/${video.id}/${name}.jpg`}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable="false"
      onError={() => setFallback(true)}
      className="h-full w-full object-cover"
    />
  );
}

function Media({ step, index, active, playing, onPlay }) {
  const video = step.video;

  if (video) {
    const vertical = Boolean(video.vertical);
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {vertical && (
          <span aria-hidden className="absolute inset-0 scale-125 opacity-60 blur-2xl">
            <Thumb video={video} />
          </span>
        )}
        <div className={`absolute inset-0 flex items-center justify-center ${vertical ? "p-0" : ""}`}>
          <div className={`relative overflow-hidden bg-black ${vertical ? "h-full aspect-[9/16]" : "h-full w-full"}`}>
            {playing && active ? (
              <iframe
                title={step.title}
                src={embedUrl(video)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={onPlay}
                tabIndex={active ? 0 : -1}
                aria-label={`Lire la vidéo : ${step.title}`}
                className="group absolute inset-0"
              >
                <span className="absolute inset-0 transition duration-700 group-hover:scale-105">
                  <Thumb video={video} eager={index === 0} />
                </span>
                <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-black/20" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center sm:h-20 sm:w-20">
                  <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
                  <span className="relative flex h-full w-full items-center justify-center rounded-full bg-white text-ebp-blue shadow-card transition group-hover:scale-110">
                    <Play size={28} className="ml-1" fill="currentColor" />
                  </span>
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const Icon = step.audio ? Headphones : ClipboardCheck;
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-gradient-to-br from-white/15 to-black/25 p-6 text-center">
      <span aria-hidden className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white text-ebp-blue shadow-card sm:h-16 sm:w-16">
        <Icon size={26} />
      </span>
      {step.audio && <Waveform color="bg-white" barClassName="w-[5px] h-9" className="relative gap-[6px]" />}
      <p className="relative max-w-[16rem] text-sm font-medium text-white/90">
        {step.audio
          ? "Un nouvel enregistrement authentique chaque semaine, écouté et travaillé en classe."
          : "Un court test avant le cours pour mesurer d'où vous partez."}
      </p>
    </div>
  );
}

function StepCard({ step, index, total, tone, active, playing, onPlay, onPrev, onNext }) {
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[2rem] text-white shadow-[0_28px_60px_-24px_rgba(0,27,107,0.55)] lg:grid lg:min-h-[430px] lg:grid-cols-[1.25fr,1fr]"
      style={{ backgroundColor: tone, transition: "background-color 320ms ease" }}
    >
      <div className="relative aspect-video shrink-0 overflow-hidden bg-ebp-blue-dark lg:aspect-auto lg:min-h-[430px]">
        <Media step={step} index={index} active={active} playing={playing} onPlay={onPlay} />
        <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-display text-xs font-bold text-ebp-blue shadow-sm">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7 lg:justify-center lg:p-10 xl:p-12">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          <Clock size={14} className="shrink-0" />
          {step.duration}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold leading-snug sm:text-[1.4rem] lg:mt-3 lg:text-3xl">{step.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-[15px] lg:mt-4 lg:text-base">{step.description}</p>
        <p className="mt-4 rounded-2xl border-l-4 border-ebp-sky bg-white/10 p-3.5 text-sm text-white/90">{step.benefit}</p>

        <div className="mt-auto flex items-center gap-3 pt-6 lg:mt-8 lg:pt-0">
          <div className="flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-soft">
            <button
              type="button"
              onClick={onPrev}
              tabIndex={active ? 0 : -1}
              aria-label="Étape précédente"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-ebp-blue-dark text-white transition hover:bg-ebp-blue active:scale-90"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={onNext}
              tabIndex={active ? 0 : -1}
              aria-label="Étape suivante"
              className="flex h-10 w-10 items-center justify-center rounded-full text-ebp-blue-dark transition hover:bg-ebp-blue/10 active:scale-90"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={active ? 0 : -1}
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-ebp-blue shadow-[0_16px_30px_-10px_rgba(0,0,0,0.5)] transition-shadow hover:shadow-[0_20px_36px_-10px_rgba(0,0,0,0.6)] lg:flex-none lg:px-7"
          >
            <YoutubeGlyph size={20} className="shrink-0 text-ebp-red" />
            <span className="truncate">Notre chaîne YouTube</span>
            <ArrowUpRight size={16} className="shrink-0" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function SessionFlow() {
  const count = SESSION_STEPS.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const stageRef = useRef(null);
  const pointerStartX = useRef(null);
  const inView = useInView(stageRef, { amount: 0.5 });
  const reduceMotion = useReducedMotion();

  const goTo = useCallback((index) => {
    setPlayingIndex(null);
    setActive(((index % count) + count) % count);
  }, [count]);
  const next = useCallback(() => goTo(active + 1), [goTo, active]);
  const prev = useCallback(() => goTo(active - 1), [goTo, active]);

  // Le défilement s'arrête dès qu'une vidéo est lancée, au survol, hors écran ou en mouvement réduit.
  const autoplayRunning = inView && !paused && !reduceMotion && playingIndex === null;

  useEffect(() => {
    if (playingIndex !== null && playingIndex !== active) setPlayingIndex(null);
  }, [active, playingIndex]);

  const handlePointerUp = (e) => {
    if (pointerStartX.current === null) return;
    const dx = e.clientX - pointerStartX.current;
    pointerStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0) next();
    else prev();
  };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") next();
    if (e.key === "ArrowLeft") prev();
  };

  const progress = (
    <span
      key={`${active}-${playingIndex === null}`}
      onAnimationEnd={next}
      className="block h-full origin-left bg-ebp-blue animate-dotFillSlow motion-reduce:animate-none"
      style={{ animationPlayState: autoplayRunning ? "running" : "paused" }}
    />
  );

  return (
    <div className="section-pad overflow-hidden bg-white">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="eyebrow justify-center">
            <Waveform barClassName="w-[2.5px] h-3" />
            Vivez la séance de l'intérieur
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">Le déroulé d'une séance EBP</h2>
          <p className="mt-4 text-ink/60">
            7 étapes, dans cet ordre, à chaque séance : {TOTAL_LABEL} où vous parlez, écoutez et progressez. Lancez les
            vidéos pour voir chaque étape en vrai.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 w-full max-w-[400px] min-w-0 sm:max-w-[460px] lg:max-w-5xl">
          <div
            ref={stageRef}
            role="region"
            aria-roledescription="carrousel"
            aria-label="Le déroulé d'une séance EBP"
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            onPointerDown={(e) => {
              pointerStartX.current = e.clientX;
              if (e.pointerType !== "mouse") setPaused(true);
            }}
            onPointerUp={(e) => {
              handlePointerUp(e);
              if (e.pointerType !== "mouse") setPaused(false);
            }}
            onPointerCancel={() => {
              pointerStartX.current = null;
              setPaused(false);
            }}
            className="relative select-none rounded-[2rem] outline-none focus-visible:ring-2 focus-visible:ring-ebp-blue/40"
            style={{ touchAction: "pan-y" }}
          >
            <div className="grid">
              {SESSION_STEPS.map((step, i) => {
                const place = placement(i, active, count);
                const isActive = place === 0;
                return (
                  <div
                    key={step.title}
                    role="group"
                    aria-roledescription="étape"
                    aria-label={`${i + 1} sur ${count} : ${step.title}`}
                    aria-hidden={!isActive}
                    className="col-start-1 row-start-1"
                    style={{
                      transform: `translateX(${place * 8}%)`,
                      opacity: isActive ? 1 : 0,
                      transition: SLIDE,
                      pointerEvents: isActive ? "auto" : "none",
                      zIndex: isActive ? 2 : 1,
                    }}
                  >
                    <StepCard
                      step={step}
                      index={i}
                      total={count}
                      tone={TONES[i]}
                      active={isActive}
                      playing={playingIndex === i}
                      onPlay={() => setPlayingIndex(i)}
                      onPrev={prev}
                      onNext={next}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 lg:hidden">
            {SESSION_STEPS.map((step, i) => (
              <button
                key={step.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Afficher l'étape ${i + 1} : ${step.title}`}
                aria-current={active === i}
                className="flex h-8 items-center"
              >
                <span
                  className={`relative block h-2 overflow-hidden rounded-full transition-all duration-300 ${
                    active === i ? "w-9 bg-ebp-blue/20" : "w-2 bg-ink/20"
                  }`}
                >
                  {active === i && progress}
                </span>
              </button>
            ))}
          </div>

          <ol className="mt-8 hidden grid-cols-7 gap-2.5 lg:grid">
            {SESSION_STEPS.map((step, i) => (
              <li key={step.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i}
                  className={`relative flex h-full w-full flex-col items-start gap-2 overflow-hidden rounded-2xl border px-3 py-3.5 text-left transition-all ${
                    active === i ? "border-ebp-blue/20 bg-surface shadow-soft" : "border-transparent hover:border-ink/10 hover:bg-surface/70"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold transition-colors ${
                      active === i ? "bg-ebp-blue text-white" : "bg-ebp-blue/10 text-ebp-blue"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`block font-display text-[13px] font-semibold leading-snug ${active === i ? "text-ink" : "text-ink/55"}`}>
                    {step.title}
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-ebp-blue/70">{step.duration}</span>
                  {active === i && (
                    <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-ebp-blue/10">
                      {progress}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ol>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 flex max-w-3xl flex-col items-center gap-4 rounded-3xl border border-ink/10 bg-surface p-6 text-center sm:flex-row sm:justify-between sm:text-left"
        >
          <div>
            <p className="font-display text-lg font-bold text-ink">Maintenant, venez le vivre.</p>
            <p className="mt-1 text-sm text-ink/60">
              Rentrée le {NEXT_COHORT_DATE} · plus que {SEATS_LEFT} places par cohorte. Le test de niveau est gratuit et
              prend 45 minutes.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
            <Link
              to={TEST_LEVEL_URL}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ebp-blue px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-ebp-blue-dark active:scale-[0.98]"
            >
              Passer le test de niveau
              <ArrowRight size={16} />
            </Link>
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.enroll)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/10 bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-ebp-green/50 active:scale-[0.98]"
            >
              <MessageCircle size={16} className="text-ebp-green" />
              Réserver ma place
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

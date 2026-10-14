import { useCallback, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Zap, ClipboardCheck, Users, Award, ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { PILLARS, TEST_LEVEL_URL, TEST_LEVEL_LABEL } from "../data/siteContent";
import { MEDIA, img, imgSrcSet } from "../data/media";
import Waveform from "./Waveform";

const ICONS = { Zap, ClipboardCheck, Users, Award };

// Quatre bleus de la famille EBP : une teinte par pilier.
const TONES = ["#002B9A", "#1E5BE6", "#001B6B", "#0F6FD6"];

const SWIPE_THRESHOLD = 40;
const SLIDE = "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), opacity 260ms ease";

// Position d'une carte autour de la carte active : 0 = visible, -1 = sortie à gauche, 1 = attend à droite.
function placement(index, active, count) {
  const offset = (index - active + count) % count;
  if (offset === 0) return 0;
  return offset === count - 1 ? -1 : 1;
}

function PillarCard({ pillar, index, total, tone, active, onPrev, onNext }) {
  const Icon = ICONS[pillar.icon];
  return (
    <article
      className="flex h-full flex-col overflow-hidden rounded-[2rem] text-white shadow-[0_28px_60px_-24px_rgba(0,27,107,0.55)] lg:grid lg:min-h-[430px] lg:grid-cols-[1.15fr,1fr]"
      style={{ backgroundColor: tone, transition: "background-color 320ms ease" }}
    >
      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-ebp-blue-dark lg:aspect-auto">
        <img
          src={img(MEDIA.pillars[pillar.icon], { w: 960 })}
          srcSet={imgSrcSet(MEDIA.pillars[pillar.icon])}
          sizes="(min-width: 1024px) 560px, (min-width: 640px) 460px, 92vw"
          alt=""
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          draggable="false"
          className="h-full w-full object-cover lg:absolute lg:inset-0"
          style={{ objectPosition: MEDIA.pillarsFocus[pillar.icon] }}
        />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 font-display text-xs font-bold text-ebp-blue shadow-sm">
          {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </span>

        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-soft lg:bottom-5 lg:right-5">
          <button
            type="button"
            onClick={onPrev}
            tabIndex={active ? 0 : -1}
            aria-label="Pilier précédent"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ebp-blue-dark text-white transition active:scale-90 hover:bg-ebp-blue"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onNext}
            tabIndex={active ? 0 : -1}
            aria-label="Pilier suivant"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ebp-blue-dark transition active:scale-90 hover:bg-ebp-blue/10"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7 lg:justify-center lg:p-10 xl:p-12">
        <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-white/70">
          <Icon size={14} className="shrink-0" />
          {pillar.tag}
        </p>
        <h3 className="mt-2 font-display text-xl font-bold leading-snug sm:text-[1.4rem] lg:mt-3 lg:text-3xl">{pillar.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-[15px] lg:mt-4 lg:text-base">{pillar.description}</p>

        <div className="mt-auto pt-6 lg:mt-8 lg:pt-0">
          <Link
            to={TEST_LEVEL_URL}
            tabIndex={active ? 0 : -1}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-ebp-blue shadow-[0_16px_30px_-10px_rgba(0,0,0,0.5)] transition-shadow hover:shadow-[0_20px_36px_-10px_rgba(0,0,0,0.6)] motion-safe:animate-floatSoft motion-safe:hover:animate-none lg:w-auto lg:px-8"
          >
            {TEST_LEVEL_LABEL}
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function FeaturesGrid() {
  const count = PILLARS.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const stageRef = useRef(null);
  const pointerStartX = useRef(null);
  const inView = useInView(stageRef, { amount: 0.5 });
  const reduceMotion = useReducedMotion();

  const goTo = useCallback((index) => setActive(((index % count) + count) % count), [count]);
  const next = useCallback(() => setActive((a) => (a + 1) % count), [count]);
  const prev = useCallback(() => setActive((a) => (a - 1 + count) % count), [count]);

  // Le défilement est piloté par l'animation de progression (3 s) : pause, hors écran et mouvement réduit l'arrêtent.
  const autoplayRunning = inView && !paused && !reduceMotion;

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
      key={active}
      onAnimationEnd={next}
      className="block h-full origin-left bg-ebp-blue animate-dotFill motion-reduce:animate-none"
      style={{ animationPlayState: autoplayRunning ? "running" : "paused" }}
    />
  );

  return (
    <section className="section-pad overflow-hidden bg-surface">
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
            Le Parcours EBP
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">Les 4 piliers de l'expérience EBP</h2>
          <p className="mt-4 text-ink/60">
            De la prise en charge en 5 minutes jusqu'à la certification finale, chaque étape est pensée
            pour vous faire progresser à l'oral.
          </p>
        </motion.div>

        <div className="mx-auto mt-12 w-full max-w-[400px] min-w-0 sm:max-w-[460px] lg:max-w-5xl">
          <div
            ref={stageRef}
            role="region"
            aria-roledescription="carrousel"
            aria-label="Les 4 piliers de l'expérience EBP"
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
              {PILLARS.map((pillar, i) => {
                const place = placement(i, active, count);
                const isActive = place === 0;
                return (
                  <div
                    key={pillar.title}
                    role="group"
                    aria-roledescription="pilier"
                    aria-label={`${i + 1} sur ${count} : ${pillar.title}`}
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
                    <PillarCard
                      pillar={pillar}
                      index={i}
                      total={count}
                      tone={TONES[i]}
                      active={isActive}
                      onPrev={prev}
                      onNext={next}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 lg:hidden">
            {PILLARS.map((pillar, i) => (
              <button
                key={pillar.title}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Afficher le pilier ${i + 1} : ${pillar.title}`}
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

          <ol className="mt-8 hidden grid-cols-4 gap-4 lg:grid">
            {PILLARS.map((pillar, i) => (
              <li key={pillar.title}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active === i}
                  className={`relative flex h-full w-full items-start gap-3 overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all ${
                    active === i
                      ? "border-ebp-blue/20 bg-white shadow-soft"
                      : "border-transparent hover:border-ink/10 hover:bg-white/70"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-colors ${
                      active === i ? "bg-ebp-blue text-white" : "bg-ebp-blue/10 text-ebp-blue"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-ebp-blue/70">{pillar.tag}</span>
                    <span className={`mt-0.5 block font-display text-sm font-semibold leading-snug ${active === i ? "text-ink" : "text-ink/55"}`}>
                      {pillar.title}
                    </span>
                  </span>
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
      </div>
    </section>
  );
}

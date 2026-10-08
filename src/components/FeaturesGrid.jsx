import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Zap, ClipboardCheck, Users, Award, ChevronLeft, ChevronRight } from "lucide-react";
import { PILLARS } from "../data/siteContent";
import { MEDIA, img, imgSrcSet } from "../data/media";
import Waveform from "./Waveform";

const ICONS = { Zap, ClipboardCheck, Users, Award };
const SLIDE_DURATION_MS = 4000;
const TRANSITION = "transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease";
const SWIPE_THRESHOLD = 40;

// Position d'une carte par rapport à la carte active : -1 (précédente), 0, 1 (suivante), 2 (cachée).
function relativeOffset(index, active, count) {
  return ((index - active + count + 1) % count) - 1;
}

function PillarCard({ pillar, index }) {
  const Icon = ICONS[pillar.icon];
  const highlighted = pillar.highlighted;
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl border shadow-card ${
        highlighted ? "border-transparent bg-ebp-blue text-white" : "border-ink/10 bg-white text-ink"
      }`}
    >
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-56">
        <img
          src={img(MEDIA.pillars[pillar.icon], { w: 960 })}
          srcSet={imgSrcSet(MEDIA.pillars[pillar.icon])}
          sizes="(min-width: 1024px) 560px, 80vw"
          alt=""
          loading={index === 0 ? "eager" : "lazy"}
          draggable="false"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ebp-blue/80 via-ebp-blue/25 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 font-display text-xs font-bold text-ebp-blue">
          {String(index + 1).padStart(2, "0")} / {String(PILLARS.length).padStart(2, "0")}
        </span>
        <span className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ebp-blue shadow-soft">
          <Icon size={20} />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wider ${
            highlighted ? "text-ebp-green-light" : "text-ebp-green"
          }`}
        >
          {pillar.tag}
        </p>
        <h3 className="mt-1.5 font-display text-lg font-semibold">{pillar.title}</h3>
        <p className={`mt-2 text-sm leading-relaxed ${highlighted ? "text-white/75" : "text-ink/60"}`}>
          {pillar.description}
        </p>
      </div>
    </article>
  );
}

export default function FeaturesGrid() {
  const count = PILLARS.length;
  const [slide, setSlide] = useState({ active: 0, previous: 0 });
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef(null);
  const pointerStartX = useRef(null);
  const resumeTimer = useRef(null);
  const inView = useInView(carouselRef, { amount: 0.4 });
  const reduceMotion = useReducedMotion();

  const goTo = useCallback(
    (index) => setSlide((s) => ({ active: ((index % count) + count) % count, previous: s.active })),
    [count]
  );
  const next = useCallback(() => setSlide((s) => ({ active: (s.active + 1) % count, previous: s.active })), [count]);
  const prev = useCallback(
    () => setSlide((s) => ({ active: (s.active - 1 + count) % count, previous: s.active })),
    [count]
  );

  useEffect(() => {
    if (!inView || paused || reduceMotion) return undefined;
    const timer = setInterval(next, SLIDE_DURATION_MS);
    return () => clearInterval(timer);
  }, [inView, paused, reduceMotion, next, slide.active]);

  useEffect(() => () => clearTimeout(resumeTimer.current), []);

  const pauseThenResume = () => {
    setPaused(true);
    clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), SLIDE_DURATION_MS * 1.5);
  };

  const handlePointerDown = (e) => {
    pointerStartX.current = e.clientX;
    if (e.pointerType !== "mouse") pauseThenResume();
  };

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
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
            Les 4 piliers de l'expérience EBP
          </h2>
          <p className="mt-4 text-ink/60">
            De la prise en charge en 5 minutes jusqu'à la certification finale, chaque étape est pensée
            pour vous faire progresser à l'oral.
          </p>
        </motion.div>

        <div
          ref={carouselRef}
          role="region"
          aria-roledescription="carrousel"
          aria-label="Les 4 piliers de l'expérience EBP"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => (pointerStartX.current = null)}
          className="relative mt-12 select-none outline-none focus-visible:ring-2 focus-visible:ring-ebp-blue/40 rounded-3xl"
          style={{ touchAction: "pan-y" }}
        >
          <div className="grid justify-items-center">
            {PILLARS.map((pillar, i) => {
              const offset = relativeOffset(i, slide.active, count);
              const previousOffset = relativeOffset(i, slide.previous, count);
              const wrapping = Math.abs(offset - previousOffset) > 1;
              const visible = offset >= -1 && offset <= 1;
              const isActive = offset === 0;
              return (
                <div
                  key={pillar.title}
                  role="group"
                  aria-roledescription="pilier"
                  aria-label={`${i + 1} sur ${count} : ${pillar.title}`}
                  aria-hidden={!isActive}
                  onClick={() => !isActive && visible && goTo(i)}
                  className={`col-start-1 row-start-1 w-[80%] sm:w-[62%] lg:w-[46%] ${
                    isActive ? "z-10" : "z-0 cursor-pointer"
                  }`}
                  style={{
                    transform: `translateX(calc(${offset} * (100% + 16px))) scale(${isActive ? 1 : 0.9})`,
                    opacity: visible ? (isActive ? 1 : 0.55) : 0,
                    transition: wrapping ? "none" : TRANSITION,
                    pointerEvents: visible ? "auto" : "none",
                  }}
                >
                  <PillarCard pillar={pillar} index={i} />
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={prev}
            aria-label="Pilier précédent"
            className="absolute left-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ebp-blue shadow-soft transition hover:bg-ebp-blue hover:text-white sm:flex lg:left-[12%]"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Pilier suivant"
            className="absolute right-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-ebp-blue shadow-soft transition hover:bg-ebp-blue hover:text-white sm:flex lg:right-[12%]"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {PILLARS.map((pillar, i) => (
            <button
              key={pillar.title}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Afficher le pilier ${i + 1} : ${pillar.title}`}
              aria-current={slide.active === i}
              className="flex h-6 items-center"
            >
              <span
                className={`block h-2 rounded-full transition-all duration-300 ${
                  slide.active === i ? "w-6 bg-ebp-blue" : "w-2 bg-ink/20"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

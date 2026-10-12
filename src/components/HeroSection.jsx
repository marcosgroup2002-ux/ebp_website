import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ArrowRight, Download, Star } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import { NEXT_COHORT_DATE, PROSPECTUS_URL } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import Waveform from "./Waveform";

const DESKTOP_QUERY = "(min-width: 1024px)";

function subscribeDesktop(callback) {
  const mq = window.matchMedia(DESKTOP_QUERY);
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

// Vrai sur ordinateur et tablette en paysage : la vidéo verticale y est affichée en entier
// dans un cadre, au lieu d'être étirée en fond d'écran et rognée.
function useIsDesktop() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false
  );
}

const IMAGE_SLIDES = MEDIA.hero.slides.map((id) => ({ type: "image", id }));

export default function HeroSection() {
  const isDesktop = useIsDesktop();
  const slides = useMemo(() => (isDesktop ? IMAGE_SLIDES : [{ type: "video" }, ...IMAGE_SLIDES]), [isDesktop]);
  const slideWidth = isDesktop ? 1920 : 960;

  const [slide, setSlide] = useState(0);
  const videoRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const current = Math.min(slide, slides.length - 1);
  const currentIsVideo = slides[current].type === "video";

  useEffect(() => {
    // Précharge les photos après le premier affichage, sans voler la bande passante à la vidéo.
    const timer = setTimeout(() => {
      MEDIA.hero.slides.forEach((path) => {
        const im = new Image();
        im.src = img(path, { w: slideWidth });
      });
    }, 2500);
    return () => clearTimeout(timer);
  }, [slideWidth]);

  useEffect(() => {
    if (currentIsVideo) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      const fallback = setTimeout(() => setSlide(1), 7000);
      return () => clearTimeout(fallback);
    }
    const timer = setTimeout(() => setSlide((s) => (s + 1) % slides.length), 4200);
    return () => clearTimeout(timer);
  }, [current, currentIsVideo, slides.length]);

  const openWhatsApp = (message) => window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");
  const onEnroll = (data) => openWhatsApp(WHATSAPP_MESSAGES.enrollWithContact(data.contact));

  return (
    <section id="top" className="relative flex min-h-screen min-h-[100vh] items-end overflow-hidden bg-ink sm:min-h-[92vh] lg:items-center">

      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={s.id || "video"}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {s.type === "video" ? (
              <video
                ref={videoRef}
                className="h-full w-full object-cover"
                autoPlay
                muted
                playsInline
                onEnded={() => setSlide(1)}
                poster={MEDIA.hero.video.poster}
              >
                <source src={MEDIA.hero.video.mp4Mobile} type="video/mp4" />
              </video>
            ) : (
              <img
                src={img(s.id, { w: slideWidth, q: 70 })}
                alt=""
                loading={i <= 1 ? "eager" : "lazy"}
                decoding="async"
                className={`h-full w-full object-cover transition-transform ease-out ${
                  i === current ? "scale-105" : "scale-100"
                }`}
                style={{
                  transitionDuration: i === current ? "5500ms" : "0ms",
                  objectPosition: MEDIA.hero.focus[s.id] || "50% 25%",
                  transformOrigin: MEDIA.hero.focus[s.id] || "50% 25%",
                }}
              />
            )}
          </div>
        ))}

        <div className="absolute inset-0 z-20 bg-gradient-to-t from-ink via-ink/75 to-ink/45 lg:bg-gradient-to-r lg:from-ink/90 lg:via-ink/65 lg:to-ink/40" />
      </div>

      <div className="absolute right-6 top-36 z-30 hidden flex-col gap-2 sm:flex lg:hidden">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Visuel ${i + 1}`}
            className={`h-1.5 w-6 rounded-full transition-all ${i === current ? "bg-ebp-sky" : "bg-white/30"}`}
          />
        ))}
      </div>

      <div className="container relative z-30 grid gap-8 pb-12 pt-32 sm:gap-10 sm:pb-16 sm:pt-40 lg:grid-cols-[minmax(0,1fr),auto] lg:items-center lg:gap-14 lg:pb-16 lg:pt-40 xl:gap-20">
        <div className="flex min-w-0 flex-col gap-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Waveform color="bg-ebp-sky" barClassName="w-[2.5px] h-3" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
              60% Pratique Orale · Cohortes de 6 Mois
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.6rem]">
            Parlez anglais avec <span className="text-ebp-sky">confiance</span> en 6 mois.
          </h1>

          <p className="mt-5 max-w-xl text-lg text-white/80">
            Une méthode <strong className="text-white">60% pratique orale</strong>, en présentiel à Cotonou et
            Calavi ou en ligne, pensée pour les professionnels aux emplois du temps chargés.
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex -space-x-3">
              {["RA", "UK", "SD", "MT"].map((initials, i) => (
                <span
                  key={initials}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-ebp-blue-light text-[11px] font-semibold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {initials}
                </span>
              ))}
            </div>
            <div className="text-sm text-white/80">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} fill="currentColor" strokeWidth={0} />
                ))}
                <span className="ml-1 font-semibold text-white">4.9/5</span>
              </div>
              <p>Cotonou · Calavi · En Ligne · Prochaine rentrée le {NEXT_COHORT_DATE}</p>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="w-full rounded-2xl bg-white p-5 shadow-card sm:p-6 lg:max-w-xl"
        >
          <p className="font-display text-sm font-semibold text-ink">Démarrez votre inscription</p>
          <label htmlFor="contact" className="mb-2 mt-3 block text-xs font-medium text-ink/50">
            Votre numéro WhatsApp ou email
          </label>
          <input
            id="contact"
            type="text"
            placeholder="Ex : 01 90 00 00 00 ou vous@email.com"
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ebp-blue"
            {...register("contact", { required: true, minLength: 6 })}
          />
          {errors.contact && (
            <p className="mt-2 text-xs text-ebp-red-soft">Merci d'indiquer un numéro ou un email valide.</p>
          )}
          <button type="button" onClick={handleSubmit(onEnroll)} className="btn-primary mt-4 w-full">
            Démarrer l'inscription (20 000 F)
            <ArrowRight size={16} />
          </button>
          <a
            href={PROSPECTUS_URL}
            download="EBP-Prospectus.pdf"
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ebp-blue"
          >
            <Download size={14} />
            Télécharger le prospectus PDF
          </a>
        </motion.form>
        </div>

        {isDesktop && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative justify-self-end"
          >
            <div className="relative aspect-[9/16] h-[min(66vh,640px)] overflow-hidden rounded-[2rem] border border-white/25 bg-ink shadow-2xl ring-8 ring-white/10">
              <video
                className="h-full w-full object-cover"
                autoPlay
                muted
                loop
                playsInline
                poster={MEDIA.hero.video.poster}
              >
                <source src={MEDIA.hero.video.mp4} type="video/mp4" />
              </video>
              <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-sm">
                <Waveform color="bg-ebp-sky" barClassName="w-[2px] h-2.5" />
                EBP en action
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}

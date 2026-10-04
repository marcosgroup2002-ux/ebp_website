import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { ArrowRight, Download, Star } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import { NEXT_COHORT_DATE } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import Waveform from "./Waveform";

const SLIDES = [
  { type: "video" },
  ...MEDIA.hero.slides.map((id) => ({ type: "image", id })),
];

export default function HeroSection() {
  const [slide, setSlide] = useState(0);
  const videoRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    MEDIA.hero.slides.forEach((path) => {
      const im = new Image();
      im.src = path;
    });
  }, []);

  useEffect(() => {
    if (slide === 0) {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
      const fallback = setTimeout(() => {
        setSlide(1);
      }, 7000);
      return () => clearTimeout(fallback);
    } else {
      const timer = setTimeout(() => {
        setSlide((s) => (s + 1) % SLIDES.length);
      }, 4200);
      return () => clearTimeout(timer);
    }
  }, [slide]);

  const openWhatsApp = (message) => window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");
  const onEnroll = (data) => openWhatsApp(WHATSAPP_MESSAGES.enrollWithContact(data.contact));
  const onProspectus = (data) => {
    const base = WHATSAPP_MESSAGES.prospectus;
    openWhatsApp(data?.contact ? `${base} Mon contact : ${data.contact}` : base);
  };

  return (
    <section id="top" className="relative flex min-h-screen min-h-[100vh] items-end overflow-hidden bg-ink sm:min-h-[92vh]">

      <div className="absolute inset-0">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              i === slide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
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
                <source src={MEDIA.hero.video.mp4} type="video/mp4" />
              </video>
            ) : (
              <img
                src={img(s.id, { w: 1920, q: 70 })}
                alt=""
                loading="eager"
                decoding="async"
                className={`h-full w-full object-cover transition-transform ease-out ${
                  i === slide ? "scale-110" : "scale-100"
                }`}
                style={{
                  transitionDuration: i === slide ? "5500ms" : "0ms",
                }}
              />
            )}
          </div>
        ))}

        <div className="absolute inset-0 z-20 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
      </div>

      <div className="absolute right-6 top-24 z-30 hidden flex-col gap-2 sm:flex">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setSlide(i)}
            aria-label={`Visuel ${i + 1}`}
            className={`h-1.5 w-6 rounded-full transition-all ${i === slide ? "bg-ebp-green-light" : "bg-white/30"}`}
          />
        ))}
      </div>

      <div className="container relative z-30 grid gap-8 pb-12 pt-28 sm:gap-10 sm:pb-16 sm:pt-36 lg:grid-cols-[1.1fr,0.9fr] lg:items-end lg:pt-40">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Waveform color="bg-ebp-green-light" barClassName="w-[2.5px] h-3" />
            <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
              60% Pratique Orale · Cohortes de 6 Mois
            </span>
          </div>

          <h1 className="font-display text-4xl font-bold leading-[1.08] text-white sm:text-5xl lg:text-[3.6rem]">
            Parlez anglais avec <span className="text-ebp-green-light">confiance</span> en 6 mois.
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
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-ebp-green-light text-[11px] font-semibold text-white"
                  style={{ zIndex: 4 - i }}
                >
                  {initials}
                </span>
              ))}
            </div>
            <div className="text-sm text-white/80">
              <div className="flex items-center gap-1 text-ebp-green-light">
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
          className="w-full rounded-2xl bg-white p-5 shadow-card sm:p-6"
        >
          <p className="font-display text-sm font-semibold text-ink">Démarrez votre inscription</p>
          <label htmlFor="contact" className="mb-2 mt-3 block text-xs font-medium text-ink/50">
            Votre numéro WhatsApp ou email
          </label>
          <input
            id="contact"
            type="text"
            placeholder="Ex : 01 90 00 00 00 ou vous@email.com"
            className="w-full rounded-xl border border-ink/10 bg-surface px-4 py-3.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-ebp-green"
            {...register("contact", { required: true, minLength: 6 })}
          />
          {errors.contact && (
            <p className="mt-2 text-xs text-ebp-red-soft">Merci d'indiquer un numéro ou un email valide.</p>
          )}
          <button type="button" onClick={handleSubmit(onEnroll)} className="btn-primary mt-4 w-full">
            Démarrer l'inscription (20 000 F)
            <ArrowRight size={16} />
          </button>
          <button
            type="button"
            onClick={handleSubmit(onProspectus, () => onProspectus({}))}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-sm font-medium text-ink/60 hover:text-ebp-blue"
          >
            <Download size={14} />
            Télécharger le prospectus PDF
          </button>
        </motion.form>
      </div>
    </section>
  );
}

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, PlayCircle } from "lucide-react";
import { TESTIMONIALS } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import { buildWhatsAppLink } from "../lib/whatsapp";
import Waveform from "./Waveform";

const PHOTO_KEYS = ["rachidatou", "ulrich", "sandra"];

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;
  const current = TESTIMONIALS[index];
  const photoId = MEDIA.testimonials[PHOTO_KEYS[index]];

  const next = () => setIndex((i) => (i + 1) % total);
  const prev = () => setIndex((i) => (i - 1 + total) % total);

  return (
    <section id="temoignages" className="section-pad bg-surface">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center">
            <Waveform barClassName="w-[2.5px] h-3" />
            Graduation Ceremony
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">Ce qu'ils disent après 6 mois</h2>
          <p className="mt-4 text-ink/60">
            Témoignages d'impétrants et projets Capstone présentés lors de nos cérémonies de graduation.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-0 overflow-hidden rounded-3xl bg-white shadow-card sm:grid-cols-[220px,1fr]">
          <div className="relative h-48 sm:h-full">
            <AnimatePresence mode="wait">
              <motion.img
                key={photoId}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                src={img(photoId, { w: 500, q: 75 })}
                alt={current.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </AnimatePresence>
          </div>

          <div className="relative p-8 sm:p-10">
            <Quote className="text-ebp-green/25" size={32} />
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <p className="mt-3 text-lg leading-relaxed text-ink/80">{current.quote}</p>
                <div className="mt-5 flex items-center gap-3">
                  <div>
                    <p className="font-display text-sm font-semibold text-ink">{current.name}</p>
                    <p className="text-xs text-ink/50">{current.role}</p>
                  </div>
                  <span className="ml-auto rounded-full bg-ebp-green/10 px-3 py-1 text-[11px] font-semibold text-ebp-green">
                    {current.cohort}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mx-auto mt-6 flex max-w-3xl items-center justify-between">
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Témoignage ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-6 bg-ebp-green" : "w-1.5 bg-ink/15"
                }`}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:bg-white"
              aria-label="Témoignage précédent"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-ink/60 transition-colors hover:bg-white"
              aria-label="Témoignage suivant"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <a
          href={buildWhatsAppLink(
            "Bonjour EBP ! J'aimerais voir les vidéos des cérémonies de Graduation et des projets Capstone."
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-ink/60 hover:text-ebp-blue"
        >
          <PlayCircle size={18} className="text-ebp-green" />
          Voir les vidéos de Graduation & projets Capstone
        </a>
      </div>
    </section>
  );
}

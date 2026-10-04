import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { PROGRAM_MONTHS } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import Waveform from "./Waveform";

export default function ProgramSection() {
  const [active, setActive] = useState(0);
  const current = PROGRAM_MONTHS[active];

  return (
    <section id="programme" className="section-pad bg-white">
      <div className="container">
        <div className="grid min-w-0 gap-12 lg:grid-cols-[0.9fr,1.1fr] lg:items-start">

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 lg:sticky lg:top-28"
          >
            <span className="eyebrow">
              <Waveform barClassName="w-[2.5px] h-3" />
              Programme Détaillé
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
              6 mois, un objectif : parler avec aisance
            </h2>
            <p className="mt-4 max-w-md text-ink/60">
              Chaque mois construit sur le précédent, de vos premiers mots à la soutenance de votre
              projet Capstone devant un jury EBP.
            </p>

            <img
              src={img(MEDIA.method.group, { w: 900, q: 70 })}
              alt="Séance de pratique orale en groupe"
              className="mt-6 hidden aspect-[4/3] w-full max-w-md rounded-2xl object-cover shadow-soft lg:block"
            />

            <div className="mt-8 flex gap-2 overflow-x-auto pb-2 lg:grid lg:grid-cols-2 lg:overflow-visible">
              {PROGRAM_MONTHS.map((m, i) => (
                <button
                  key={m.month}
                  onClick={() => setActive(i)}
                  className={`shrink-0 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                    active === i
                      ? "border-ebp-blue bg-ebp-blue text-white shadow-soft"
                      : "border-ink/10 bg-surface text-ink/70 hover:border-ebp-blue/40"
                  }`}
                >
                  {m.month}
                </button>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative min-w-0 min-h-[280px] rounded-3xl border border-ink/10 bg-surface p-8 sm:p-10"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ebp-green text-sm font-bold text-white">
                    {active + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-ebp-green">
                    {current.month} / 6
                  </span>
                </div>
                <h3 className="mt-5 font-display text-2xl font-bold text-ink">{current.title}</h3>
                <p className="mt-4 max-w-xl text-ink/65">{current.description}</p>

                <div className="mt-8 flex items-center gap-2 text-sm text-ink/50">
                  <CheckCircle2 size={16} className="text-ebp-green" />
                  Évaluation Pretest / Posttest à la clôture du mois
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-1.5">
              {PROGRAM_MONTHS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= active ? "bg-ebp-green" : "bg-ink/10"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

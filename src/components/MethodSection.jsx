import { motion } from "framer-motion";
import { PHILOSOPHY_QUOTE, PHILOSOPHY_TEXT, SESSION_STEPS } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import Waveform from "./Waveform";

export default function MethodSection() {
  return (
    <section className="bg-white">
      {/* Bandeau photo + citation de philosophie pédagogique */}
      <div className="relative overflow-hidden">
        <img
          src={img(MEDIA.method.banner, { w: 1920, q: 65 })}
          alt="Classe EBP en session interactive de pratique orale"
          className="h-[380px] w-full object-cover object-center sm:h-[420px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/50 to-ink/20" />
        <div className="absolute inset-0 flex items-end">
          <div className="container pb-12">
            <span className="eyebrow text-ebp-green-light">
              <Waveform color="bg-ebp-green-light" barClassName="w-[2.5px] h-3" />
              Notre philosophie
            </span>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold italic text-white sm:text-3xl">
              "{PHILOSOPHY_QUOTE}"
            </p>
            <p className="mt-3 max-w-xl text-sm text-white/75">{PHILOSOPHY_TEXT}</p>
          </div>
        </div>
      </div>

      {/* Déroulé standard d'une séance : vraie séquence, la numérotation a un sens ici */}
      <div className="section-pad">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-ink sm:text-4xl">Le déroulé d'une séance EBP</h2>
            <p className="mt-4 text-ink/60">
              7 étapes non négociables, dans cet ordre, à chaque séance, pour garantir que la pratique
              orale reste au centre.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SESSION_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-2xl border border-ink/10 bg-surface p-5"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ebp-blue text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-ebp-green">
                    {step.duration}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-sm font-semibold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

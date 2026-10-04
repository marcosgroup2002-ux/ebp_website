import { motion } from "framer-motion";
import { Zap, ClipboardCheck, Users, Award } from "lucide-react";
import { PILLARS } from "../data/siteContent";
import Waveform from "./Waveform";

const ICONS = { Zap, ClipboardCheck, Users, Award };

export default function FeaturesGrid() {
  return (
    <section className="section-pad bg-surface">
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

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((pillar, i) => {
            const Icon = ICONS[pillar.icon];
            return (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-2xl border p-6 transition-shadow hover:shadow-soft ${
                  pillar.highlighted
                    ? "border-transparent bg-ebp-blue text-white shadow-card"
                    : "border-ink/10 bg-white text-ink"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    pillar.highlighted ? "bg-white/15 text-white" : "bg-ebp-blue/10 text-ebp-blue"
                  }`}
                >
                  <Icon size={20} />
                </span>
                <p
                  className={`mt-4 text-[11px] font-semibold uppercase tracking-wider ${
                    pillar.highlighted ? "text-ebp-green-light" : "text-ebp-green"
                  }`}
                >
                  {pillar.tag}
                </p>
                <h3 className="mt-1.5 font-display text-base font-semibold">{pillar.title}</h3>
                <p className={`mt-2 text-sm leading-relaxed ${pillar.highlighted ? "text-white/75" : "text-ink/60"}`}>
                  {pillar.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { CheckCircle2, MessagesSquare } from "lucide-react";
import { TEAM_POINTS } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import Waveform from "./Waveform";

export default function TeamSection() {
  return (
    <section className="section-pad bg-surface">
      <div className="container grid gap-14 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="eyebrow">
            <Waveform barClassName="w-[2.5px] h-3" />
            Encadrement
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
            Portés par une équipe dédiée
          </h2>
          <p className="mt-4 max-w-md text-ink/60">
            Derrière chaque cohorte, des formateurs certifiés et un système de suivi conçu pour qu'aucun
            apprenant ne décroche.
          </p>

          <ul className="mt-8 space-y-4">
            {TEAM_POINTS.map((point) => (
              <li key={point} className="flex items-start gap-3">
                <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-ebp-green" />
                <span className="text-sm text-ink/75">{point}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative"
        >
          <img
            src={img(MEDIA.team.coaching1, { w: 900, q: 72 })}
            alt="Équipe des formateurs et coachs certifiés EBP"
            className="aspect-[4/3] w-full rounded-3xl object-cover object-top shadow-card sm:aspect-[4/5]"
          />

          <div className="absolute -bottom-6 left-6 right-6 rounded-2xl bg-white p-5 shadow-card sm:left-8 sm:right-auto sm:w-72">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
                <MessagesSquare size={16} />
              </span>
              <p className="font-display text-sm font-semibold text-ink">Équipe Pédagogique</p>
            </div>
            <p className="mt-2 text-xs text-ink/60">
              Formateurs certifiés, suivi individuel chaque semaine et relances personnalisées.
            </p>
            <span className="mt-3 inline-flex items-center rounded-full bg-ebp-green/10 px-2.5 py-1 text-[10px] font-semibold text-ebp-green">
              Early Warning System actif
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

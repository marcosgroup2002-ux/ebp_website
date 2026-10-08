import { motion } from "framer-motion";
import { AlarmClock, Download, ArrowRight } from "lucide-react";
import { NEXT_COHORT_DATE, SEATS_LEFT, PROSPECTUS_URL } from "../data/siteContent";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import Waveform from "./Waveform";

export default function CTASection() {
  return (
    <section className="section-pad bg-surface">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl bg-ebp-red px-8 py-12 text-center sm:px-14"
        >
          <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-10" />
          <span className="mx-auto inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">
            <AlarmClock size={14} />
            Places limitées · Rentrée du {NEXT_COHORT_DATE}
          </span>

          <h2 className="mx-auto mt-5 max-w-xl font-display text-2xl font-bold text-white sm:text-3xl">
            La prochaine rentrée approche ! Plus que {SEATS_LEFT} places par cohorte pour garantir la
            qualité de la pratique orale.
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/85">
            Confirmez votre place dès aujourd'hui et rejoignez une cohorte à taille humaine.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.enroll)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ebp-blue px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-ebp-blue-dark active:scale-[0.98]"
            >
              S'inscrire à 20 000 F
              <ArrowRight size={16} />
            </a>
            <a
              href={PROSPECTUS_URL}
              download="EBP-Prospectus.pdf"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-[0.98]"
            >
              <Download size={16} />
              Télécharger le Prospectus PDF
            </a>
          </div>

          <div className="mt-6 flex items-center justify-center">
            <Waveform color="bg-white/70" barClassName="w-1 h-4" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

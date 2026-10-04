import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { PRICING_OPTIONS, FEES } from "../data/siteContent";
import { usePricingStore } from "../store/usePricingStore";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import Waveform from "./Waveform";

export default function PricingSection() {
  const { selectedOption, setSelectedOption } = usePricingStore();

  return (
    <section id="tarifs" className="section-pad bg-white">
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
            Moteur de Tarification Transparent
          </span>
          <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">Tarifs & Options d'Échéancier</h2>
          <p className="mt-4 text-ink/60">
            Deux façons de financer votre progression : choisissez celle qui correspond à votre rythme.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          {PRICING_OPTIONS.map((option, i) => {
            const isSelected = selectedOption === option.id;
            return (
              <motion.button
                key={option.id}
                type="button"
                onClick={() => setSelectedOption(option.id)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                className={`relative rounded-3xl border p-7 text-left transition-all ${
                  option.highlight
                    ? "border-transparent bg-ebp-blue text-white shadow-card"
                    : "border-ink/10 bg-surface text-ink hover:border-ebp-blue/40"
                } ${isSelected ? "ring-2 ring-ebp-green ring-offset-2 ring-offset-white" : ""}`}
              >
                {option.badge && (
                  <span className="absolute -top-3 right-6 inline-flex items-center rounded-full bg-ebp-red px-3 py-1 text-[11px] font-semibold text-white shadow-xs">
                    {option.badge}
                  </span>
                )}

                <p
                  className={`text-xs font-semibold uppercase tracking-wider ${
                    option.highlight ? "text-ebp-green-light" : "text-ebp-green"
                  }`}
                >
                  {option.label}
                </p>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-display text-3xl font-bold">{option.price}</span>
                  <span className={`text-xs ${option.highlight ? "text-white/60" : "text-ink/50"}`}>
                    {option.unit}
                  </span>
                </div>

                <p className={`mt-3 text-sm ${option.highlight ? "text-white/75" : "text-ink/60"}`}>
                  {option.conditions}
                </p>

                <div className={`mt-4 flex items-start gap-2 text-sm ${option.highlight ? "text-white/85" : "text-ink/70"}`}>
                  <Check size={16} className={`mt-0.5 shrink-0 ${option.highlight ? "text-ebp-green-light" : "text-ebp-green"}`} />
                  {option.advantage}
                </div>

                <a
                  href={buildWhatsAppLink(
                    option.id === "bloc" ? WHATSAPP_MESSAGES.bloc : WHATSAPP_MESSAGES.echelonne
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-6 block w-full rounded-full py-3 text-center text-sm font-semibold transition-all active:scale-[0.98] ${
                    option.highlight
                      ? "bg-ebp-green text-white hover:bg-ebp-green-light"
                      : "bg-ebp-blue text-white hover:bg-ebp-blue-dark"
                  }`}
                >
                  {option.cta}
                </a>
              </motion.button>
            );
          })}
        </div>
        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-dashed border-ink/15 bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Frais Annexes</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {FEES.map((fee) => (
              <div key={fee.label} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{fee.label}</p>
                  <p className="text-xs text-ink/50">{fee.note}</p>
                </div>
                <span className="font-display font-semibold text-ebp-blue">{fee.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

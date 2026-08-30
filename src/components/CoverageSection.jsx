import { motion } from "framer-motion";
import { Globe2 } from "lucide-react";
import { COVERAGE_HUBS } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import Waveform from "./Waveform";

const PRIMARY = COVERAGE_HUBS.filter((h) => h.primary);
const SECONDARY = COVERAGE_HUBS.filter((h) => !h.primary);

export default function CoverageSection() {
  return (
    <section className="relative overflow-hidden">
      <img
        src={img(MEDIA.hero.slides[1], { w: 1920, q: 60 })}
        alt="Apprenants en classe en ligne"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-ebp-blue-dark/85" />

      <div className="container relative section-pad grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="eyebrow">
            <Waveform barClassName="w-[2.5px] h-3" />
            Portée Régionale
          </span>
          <h2 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
            Du Bénin à toute la diaspora francophone
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            Deux centres au cœur de Cotonou et Calavi, et des classes en ligne interactives via Google
            Meet pour les apprenants de la sous-région et de la diaspora.
          </p>
          <div className="mt-8 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/80 backdrop-blur-sm">
            <Globe2 size={16} className="text-ebp-green-light" />
            Cours en direct, mêmes standards de pratique orale, où que vous soyez.
          </div>
        </div>

        {/* node network */}
        <div className="relative aspect-[4/3] w-full rounded-3xl border border-white/15 bg-white/5 backdrop-blur-sm">
          <svg viewBox="0 0 100 75" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
            {SECONDARY.map((hub) =>
              PRIMARY.map((p) => (
                <line
                  key={`${p.name}-${hub.name}`}
                  x1={p.x}
                  y1={p.y}
                  x2={hub.x}
                  y2={hub.y}
                  stroke="rgba(22, 163, 74, 0.4)"
                  strokeWidth="0.3"
                  strokeDasharray="1.2 1.2"
                />
              ))
            )}
          </svg>

          {COVERAGE_HUBS.map((hub) => (
            <div
              key={hub.name}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
            >
              <motion.span
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute h-3 w-3 rounded-full ${hub.primary ? "bg-ebp-green" : "bg-white/40"}`}
              />
              <span
                className={`relative rounded-full ${
                  hub.primary ? "h-2.5 w-2.5 bg-ebp-green-light" : "h-1.5 w-1.5 bg-white/70"
                }`}
              />
              <span
                className={`mt-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  hub.primary ? "bg-ebp-green text-white" : "bg-white/10 text-white/70"
                }`}
              >
                {hub.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

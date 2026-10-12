import { motion } from "framer-motion";
import { MapPin, Monitor, Clock } from "lucide-react";
import { CENTERS } from "../data/siteContent";

const ICONS = { MapPin, Monitor, Clock };

export default function FormatsBanner() {
  return (
    <section id="formats" className="border-y border-ink/10 bg-white">
      <div className="container grid grid-cols-2 gap-x-4 gap-y-6 py-8 sm:grid-cols-4 sm:gap-4 lg:py-10">
        {CENTERS.map((center, i) => {
          const Icon = ICONS[center.icon];
          return (
            <motion.div
              key={center.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 text-ink"
            >
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">{center.title}</p>
                <p className="mt-0.5 text-xs text-ink/60">{center.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

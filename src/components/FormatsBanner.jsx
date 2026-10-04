import { motion } from "framer-motion";
import { MapPin, Monitor, Clock } from "lucide-react";
import { CENTERS } from "../data/siteContent";
import { MEDIA, img } from "../data/media";

const ICONS = { MapPin, Monitor, Clock };

export default function FormatsBanner() {
  return (
    <section id="formats" className="relative overflow-hidden">
      <img
        src={img(MEDIA.formats.banner, { w: 1600, q: 60 })}
        alt="Formations EBP"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ebp-green/95 to-ebp-green-light/90" />
      <div className="container relative grid grid-cols-2 gap-6 py-8 sm:grid-cols-4 sm:gap-4">
        {CENTERS.map((center, i) => {
          const Icon = ICONS[center.icon];
          return (
            <motion.div
              key={center.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-start gap-3 text-white"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <Icon size={16} />
              </span>
              <div>
                <p className="text-sm font-semibold">{center.title}</p>
                <p className="text-xs text-white/80">{center.detail}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { PHILOSOPHY_QUOTE, PHILOSOPHY_TEXT } from "../data/siteContent";
import { MEDIA, img, imgSrcSet } from "../data/media";
import Waveform from "./Waveform";
import SessionFlow from "./SessionFlow";

export default function MethodSection() {
  return (
    <section className="bg-white">

      <div className="relative overflow-hidden">
        <img
          src={img(MEDIA.method.banner, { w: 1920, q: 65 })}
          srcSet={imgSrcSet(MEDIA.method.banner)}
          sizes="100vw"
          alt="Classe EBP en session interactive de pratique orale"
          className="h-[380px] w-full object-cover object-[50%_18%] sm:h-[440px] lg:h-[560px] 2xl:h-[680px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/50 to-ink/20" />
        <div className="absolute inset-0 flex items-end">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="container pb-12"
          >
            <span className="eyebrow rounded-full bg-ink/70 px-3 py-1.5 text-ebp-sky backdrop-blur-sm">
              <Waveform color="bg-ebp-sky" barClassName="w-[2.5px] h-3" />
              Notre philosophie
            </span>
            <p className="mt-3 max-w-2xl font-display text-2xl font-semibold italic text-white sm:text-3xl">
              "{PHILOSOPHY_QUOTE}"
            </p>
            <p className="mt-3 max-w-xl text-sm text-white/75">{PHILOSOPHY_TEXT}</p>
          </motion.div>
        </div>
      </div>

      <SessionFlow />
    </section>
  );
}

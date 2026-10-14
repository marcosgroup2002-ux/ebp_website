import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Home, MessageCircle, Sparkles, PartyPopper, FileCheck2 } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../../lib/whatsapp";
import { SKILL_INFO } from "./QuestionScreen";

export const LEVEL_COPY = {
  "Pré-A1": {
    name: "Grand débutant",
    text: "Vous démarrez votre aventure en anglais, et c'est le meilleur moment pour commencer. Avec un accompagnement pas à pas, vous allez vite prendre confiance.",
  },
  A1: {
    name: "Débutant",
    text: "Vous comprenez et utilisez des expressions simples du quotidien. Les bases sont posées : il est temps de les faire parler !",
  },
  A2: {
    name: "Élémentaire",
    text: "Vous vous débrouillez dans les situations courantes. Avec une pratique orale régulière, vous allez gagner en aisance très vite.",
  },
  B1: {
    name: "Intermédiaire",
    text: "Vous êtes autonome dans la plupart des situations. C'est le moment idéal pour gagner en fluidité et en assurance à l'oral.",
  },
  B2: {
    name: "Intermédiaire avancé",
    text: "Vous communiquez avec aisance et spontanéité. Il ne reste qu'à affiner votre expression et votre vocabulaire professionnel.",
  },
  C1: {
    name: "Avancé",
    text: "Vous vous exprimez de façon fluide et nuancée. Un entraînement ciblé peut faire de vous un orateur vraiment percutant.",
  },
  C2: {
    name: "Maîtrise",
    text: "Votre niveau est excellent. Nos ateliers de pratique avancée vous aideront à exceller en situation professionnelle.",
  },
};

const CONFETTI_COLORS = ["#002B9A", "#1E5BE6", "#9DBBFF", "#E50914", "#FFC83D", "#00873D"];

function useCountUp(target, duration = 1500) {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduce]);
  return reduce ? target : value;
}

function Confetti() {
  const reduce = useReducedMotion();
  const [pieces] = useState(() =>
    Array.from({ length: 34 }, (_, i) => ({
      id: i,
      left: 4 + Math.random() * 92,
      drift: (Math.random() - 0.5) * 140,
      rotate: (Math.random() - 0.5) * 720,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.4,
      size: 6 + Math.random() * 7,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      round: i % 3 === 0,
    }))
  );
  if (reduce) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute top-0 ${p.round ? "rounded-full" : "rounded-[2px]"}`}
          style={{ left: `${p.left}%`, width: p.size, height: p.size * (p.round ? 1 : 1.6), backgroundColor: p.color }}
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 360, x: p.drift, rotate: p.rotate, opacity: [0, 1, 1, 0] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function SkillBar({ skill, ok, total, delay }) {
  const info = SKILL_INFO[skill];
  const pct = total ? Math.round((ok / total) * 100) : 0;
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 font-semibold text-ink">
          <info.icon size={15} className="text-ebp-blue" />
          {info.label}
        </span>
        <span className="tabular-nums text-ink/55">
          {ok} / {total}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-ebp-blue/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-ebp-blue to-sky-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </li>
  );
}

export default function ResultScreen({ result }) {
  const level = result.niveau;
  const copy = LEVEL_COPY[level] || LEVEL_COPY["A1"];
  const firstName = (result.nom || "").trim().split(/\s+/)[0];
  const score = useCountUp(Math.round(result.score));
  const skills = ["grammaire", "vocabulaire", "lecture", "ecoute"].filter((s) => result.par_competence?.[s]);

  return (
    <div className="mx-auto max-w-xl pt-2 sm:pt-6">
      <motion.section
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ebp-blue via-[#0a35b8] to-ebp-blue-dark p-7 text-center text-white shadow-[0_30px_70px_-30px_rgba(0,27,107,0.9)] sm:p-10"
      >
        <Confetti />
        <p className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur">
          <PartyPopper size={14} />
          Test terminé{firstName ? `, bravo ${firstName} !` : " !"}
        </p>

        <p className="relative mt-6 text-sm font-medium text-white/70">Votre niveau estimé</p>
        <motion.div
          initial={{ scale: 0.3, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.25 }}
          className="relative mx-auto mt-3 flex h-28 w-28 items-center justify-center rounded-[2rem] bg-white font-display text-5xl font-extrabold text-ebp-blue shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] sm:h-32 sm:w-32 sm:text-6xl"
        >
          {level}
        </motion.div>
        <h1 className="relative mt-5 font-display text-2xl font-bold sm:text-3xl">{copy.name}</h1>
        <p className="relative mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/80">{copy.text}</p>

        <div className="relative mx-auto mt-6 inline-flex items-baseline gap-1.5 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
          <span className="font-display text-4xl font-extrabold tabular-nums">{score}</span>
          <span className="text-lg font-semibold text-white/60">/ {Math.round(result.score_max)}</span>
          <span className="ml-1 text-xs text-white/60">bonnes réponses</span>
        </div>
      </motion.section>

      {skills.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-5 rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-7"
        >
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-ink">
            <Sparkles size={17} className="text-ebp-blue" />
            Vos points forts
          </h2>
          <ul className="mt-4 space-y-4">
            {skills.map((skill, i) => (
              <SkillBar key={skill} skill={skill} ok={result.par_competence[skill][0]} total={result.par_competence[skill][1]} delay={0.7 + i * 0.15} />
            ))}
          </ul>
        </motion.section>
      )}

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
        className="mt-5 rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-7"
      >
        <p className="flex items-start gap-3 text-sm leading-relaxed text-ink/65">
          <FileCheck2 size={18} className="mt-0.5 shrink-0 text-ebp-blue" />
          <span>
            Votre résultat a été transmis à l'équipe EBP, qui vous contactera sur WhatsApp.
            {result.redaction_recue
              ? " Votre rédaction sera lue par nos formateurs, qui confirmeront votre niveau."
              : " Ce niveau est une estimation : notre équipe le confirmera avec vous."}
          </span>
        </p>

        <a
          href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelResult(result.nom, level))}
          target="_blank"
          rel="noopener noreferrer"
          className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ebp-blue px-6 py-4 text-base font-bold text-white shadow-[0_16px_30px_-12px_rgba(0,43,154,0.7)] transition hover:bg-ebp-blue-dark active:scale-[0.98]"
        >
          <MessageCircle size={18} />
          Réserver ma place
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </a>
        <Link
          to="/"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-ink/60 transition hover:bg-ebp-blue/5 hover:text-ebp-blue"
        >
          <Home size={16} />
          Retour à l'accueil
        </Link>
      </motion.section>
    </div>
  );
}

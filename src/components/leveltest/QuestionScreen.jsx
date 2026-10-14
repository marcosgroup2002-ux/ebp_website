import { useEffect } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Headphones, BookOpen, PenLine, Languages, Sparkles } from "lucide-react";
import { PASSAGES } from "../../data/levelTest";
import VoicePlayer from "./VoicePlayer";

export const SKILL_INFO = {
  grammaire: {
    label: "Grammaire",
    icon: PenLine,
    title: "Grammaire",
    text: "Complétez chaque phrase avec la meilleure option. Les premières questions sont simples, elles se corsent peu à peu.",
  },
  vocabulaire: {
    label: "Vocabulaire",
    icon: Languages,
    title: "Vocabulaire et expressions",
    text: "Choisissez le mot ou l'expression qui convient le mieux au sens de la phrase.",
  },
  lecture: {
    label: "Compréhension écrite",
    icon: BookOpen,
    title: "Compréhension écrite",
    text: "Lisez attentivement les textes, puis répondez aux questions. Vous pouvez relire le texte à tout moment.",
  },
  ecoute: {
    label: "Compréhension orale",
    icon: Headphones,
    title: "Compréhension orale",
    text: "Écoutez les enregistrements, autant de fois que nécessaire, puis répondez. Des écouteurs sont recommandés.",
  },
};

function QuestionText({ text }) {
  return text.split(/(_{3,})/).map((part, i) =>
    /^_{3,}$/.test(part) ? (
      <span
        key={i}
        role="img"
        aria-label="espace à compléter"
        className="mx-1 inline-block min-w-[3.5rem] translate-y-0.5 border-b-[3px] border-dashed border-ebp-blue/50 sm:min-w-[5rem]"
      />
    ) : (
      part
    )
  );
}

function PassageCard({ passageId }) {
  const passage = PASSAGES[passageId];
  return (
    <section
      aria-label={`Texte à lire : ${passage.title}`}
      className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-ink/5 lg:sticky lg:top-4"
    >
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ebp-blue">
        <BookOpen size={14} />
        Texte {passageId}
      </p>
      <h3 className="mt-2 font-display text-lg font-bold leading-snug text-ink">{passage.title}</h3>
      <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 text-[15px] leading-relaxed text-ink/75 lg:max-h-[60vh]">
        {passage.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </section>
  );
}

export function SectionScreen({ skill, number, count, onStart }) {
  const info = SKILL_INFO[skill];
  const Icon = info.icon;
  return (
    <div className="mx-auto max-w-xl pt-6 text-center sm:pt-12">
      <motion.span
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-ebp-blue text-white shadow-[0_20px_40px_-16px_rgba(0,43,154,0.8)]"
      >
        <Icon size={34} />
      </motion.span>
      <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-ebp-blue">Partie {number}</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-ink">{info.title}</h2>
      <p className="mx-auto mt-3 max-w-md text-ink/60">{info.text}</p>
      <p className="mt-4 inline-flex rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ink/60 shadow-sm ring-1 ring-ink/5">
        {count} question{count > 1 ? "s" : ""}
      </p>
      <div className="mt-8">
        <button
          type="button"
          onClick={onStart}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-ebp-blue px-8 py-4 text-base font-bold text-white shadow-[0_16px_30px_-12px_rgba(0,43,154,0.7)] transition hover:bg-ebp-blue-dark active:scale-[0.98]"
        >
          C'est parti
          <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

export function ActionBar({ onPrev, onNext, canPrev, nextLabel, nextIcon: NextIcon = ChevronRight, nextTone = "primary", disabled }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md sm:static sm:mt-8 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="inline-flex h-12 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-ink/60 transition hover:bg-white hover:text-ebp-blue disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={18} />
          Précédent
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={disabled}
          className={`group inline-flex h-12 min-w-[9rem] items-center justify-center gap-2 rounded-full px-7 text-sm font-bold transition active:scale-[0.97] disabled:opacity-60 ${
            nextTone === "primary"
              ? "bg-ebp-blue text-white shadow-[0_14px_28px_-12px_rgba(0,43,154,0.7)] hover:bg-ebp-blue-dark"
              : "bg-white text-ebp-blue shadow-sm ring-1 ring-ebp-blue/20 hover:bg-ebp-blue/5"
          }`}
        >
          {nextLabel}
          <NextIcon size={17} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

export function QuestionScreen({ question, number, total, answer, onAnswer, onPrev, onNext, canPrev }) {
  const info = SKILL_INFO[question.skill];
  const pct = Math.round(((number - 1) / total) * 100);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      const key = e.key.toLowerCase();
      const choice = ["1", "2", "3", "4"].indexOf(key) >= 0 ? Number(key) - 1 : ["a", "b", "c", "d"].indexOf(key);
      if (choice >= 0) onAnswer(choice);
      else if (key === "arrowright" || (key === "enter" && e.target.tagName !== "BUTTON" && e.target.tagName !== "A")) onNext();
      else if (key === "arrowleft") onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAnswer, onNext, onPrev]);

  const hasAside = Boolean(question.passage);

  return (
    <div>
      <div className="mx-auto mb-5 max-w-2xl">
        <div className="flex items-center justify-between text-xs font-semibold text-ink/55">
          <span>
            Question {number} <span className="text-ink/35">sur {total}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-ebp-blue shadow-sm ring-1 ring-ebp-blue/10">
            <info.icon size={12} />
            {info.label}
          </span>
        </div>
        <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-ebp-blue/10" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={number - 1} aria-label="Progression du test">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-ebp-blue to-sky-400"
            initial={false}
            animate={{ width: `${Math.max(pct, 3)}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </div>

      <div className={hasAside ? "grid gap-5 lg:grid-cols-2 lg:items-start" : "mx-auto max-w-2xl space-y-5"}>
        {question.passage && <PassageCard passageId={question.passage} />}
        {question.audio && <VoicePlayer key={question.audio} audioId={question.audio} />}

        <div className="space-y-5">
          <div className="rounded-3xl bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-7">
            <h2 className="font-display text-xl font-bold leading-snug text-ink sm:text-2xl">
              <QuestionText text={question.text} />
            </h2>
          </div>

          <div role="radiogroup" aria-label="Choisissez votre réponse" className="space-y-3">
            {question.choices.map((choice, i) => {
              const selected = answer === i;
              return (
                <motion.button
                  key={i}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => onAnswer(i)}
                  whileTap={{ scale: 0.985 }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 + i * 0.05 }}
                  className={`flex min-h-[3.5rem] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${
                    selected
                      ? "border-ebp-blue bg-ebp-blue/[0.06] shadow-soft"
                      : "border-ink/10 bg-white hover:border-ebp-blue/40 hover:bg-white"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold transition-colors ${
                      selected ? "bg-ebp-blue text-white" : "bg-ebp-blue/10 text-ebp-blue"
                    }`}
                  >
                    {selected ? (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 16 }}>
                        <Check size={18} strokeWidth={3} />
                      </motion.span>
                    ) : (
                      "ABCD"[i]
                    )}
                  </span>
                  <span className="text-base leading-snug text-ink">{choice}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      <ActionBar
        onPrev={onPrev}
        onNext={onNext}
        canPrev={canPrev}
        nextLabel={answer === undefined ? "Passer" : "Suivant"}
        nextTone={answer === undefined ? "ghost" : "primary"}
      />
    </div>
  );
}

export function Milestone({ message }) {
  return (
    <motion.div
      role="status"
      initial={{ opacity: 0, y: -16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="pointer-events-none fixed inset-x-0 bottom-[5.5rem] z-40 flex justify-center px-4 sm:bottom-auto sm:top-24"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-ebp-blue px-5 py-2.5 text-sm font-semibold text-white shadow-[0_16px_32px_-12px_rgba(0,43,154,0.8)]">
        <Sparkles size={15} />
        {message}
      </span>
    </motion.div>
  );
}

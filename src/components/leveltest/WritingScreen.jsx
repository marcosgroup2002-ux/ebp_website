import { motion } from "framer-motion";
import { PenLine, CheckCircle2 } from "lucide-react";
import { WRITING_PROMPTS } from "../../data/levelTest";
import { ActionBar } from "./QuestionScreen";

const MAX_CHARS = 1500;

export function countWords(text) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export default function WritingScreen({ promptId, text, onPrompt, onText, onPrev, onFinish, busy }) {
  const prompt = WRITING_PROMPTS.find((p) => p.id === promptId) || WRITING_PROMPTS[0];
  const words = countWords(text);
  const goalReached = words >= 50;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="text-center">
        <motion.span
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-ebp-blue text-white shadow-[0_18px_36px_-16px_rgba(0,43,154,0.8)]"
        >
          <PenLine size={28} />
        </motion.span>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-ebp-blue">Dernière étape</p>
        <h2 className="mt-2 font-display text-2xl font-bold text-ink sm:text-3xl">Écrivez quelques lignes</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
          Choisissez un sujet et écrivez 50 à 100 mots en anglais. C'est facultatif, mais cela aide notre équipe à confirmer votre niveau.
        </p>
      </div>

      <div role="tablist" aria-label="Sujet de rédaction" className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-ink/5">
        {WRITING_PROMPTS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === prompt.id}
            onClick={() => onPrompt(p.id)}
            className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
              p.id === prompt.id ? "bg-ebp-blue text-white shadow-sm" : "text-ink/60 hover:bg-ebp-blue/5"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-3xl bg-white p-5 shadow-card ring-1 ring-ink/5 sm:p-6">
        <p className="text-[15px] leading-relaxed text-ink/75">{prompt.text}</p>
        <label htmlFor="writing" className="sr-only">
          Votre rédaction en anglais
        </label>
        <textarea
          id="writing"
          value={text}
          onChange={(e) => onText(e.target.value.slice(0, MAX_CHARS))}
          rows={8}
          placeholder="Write your answer here…"
          className="mt-4 w-full resize-y rounded-2xl border-2 border-ink/10 bg-surface px-4 py-3.5 text-base leading-relaxed text-ink placeholder:text-ink/30 transition focus:border-ebp-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-ebp-blue/10"
        />
        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`inline-flex items-center gap-1.5 font-semibold ${goalReached ? "text-ebp-green" : "text-ink/45"}`}>
            {goalReached && <CheckCircle2 size={14} />}
            {words} mot{words > 1 ? "s" : ""}
            {!goalReached && <span className="font-normal text-ink/35"> · visez 50 à 100</span>}
          </span>
          <span className="text-ink/35 tabular-nums">
            {text.length} / {MAX_CHARS}
          </span>
        </div>
      </div>

      <ActionBar
        onPrev={onPrev}
        onNext={onFinish}
        canPrev
        disabled={busy}
        nextLabel={words === 0 ? "Terminer sans rédaction" : "Terminer le test"}
        nextIcon={CheckCircle2}
      />
    </div>
  );
}

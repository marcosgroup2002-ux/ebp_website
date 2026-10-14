import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Eye, Lock, MessageCircle, RefreshCw } from "lucide-react";
import Seo from "../components/Seo";
import Waveform from "../components/Waveform";
import { QUESTIONS } from "../data/levelTest";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import {
  START_ERRORS,
  SUBMIT_ERRORS,
  clearProgress,
  fetchResult,
  loadProgress,
  loadSavedResult,
  saveProgress,
  saveResult,
  startTest,
  submitTest,
} from "../services/levelTestService";
import Shell, { TimerPill, useCountdown } from "../components/leveltest/Shell";
import IntroScreen from "../components/leveltest/IntroScreen";
import { Milestone, QuestionScreen, SectionScreen } from "../components/leveltest/QuestionScreen";
import WritingScreen from "../components/leveltest/WritingScreen";
import ResultScreen from "../components/leveltest/ResultScreen";

const SKILL_ORDER = ["grammaire", "vocabulaire", "lecture", "ecoute"];
const GRACE_MS = 5 * 60 * 1000;
const MILESTONES = [
  { at: 0.25, text: "Beau départ, continuez comme ça !" },
  { at: 0.5, text: "Déjà la moitié du chemin, bravo !" },
  { at: 0.75, text: "Plus que quelques questions, courage !" },
];

function buildSteps(activeIds) {
  const active = new Set(activeIds || []);
  const questions = QUESTIONS.filter((q) => active.has(q.id));
  const steps = [];
  SKILL_ORDER.forEach((skill) => {
    const group = questions.filter((q) => q.skill === skill);
    if (group.length === 0) return;
    steps.push({ type: "section", skill, count: group.length });
    group.forEach((question) => steps.push({ type: "question", question }));
  });
  steps.push({ type: "writing" });
  return steps;
}

function readInitial() {
  const saved = loadSavedResult();
  if (saved?.result?.status === "ok") return { phase: "result", result: saved.result };
  const progress = loadProgress();
  if (progress?.attemptId && progress.expiresAt && Date.now() < progress.expiresAt + GRACE_MS) {
    return {
      phase: "test",
      session: { attemptId: progress.attemptId, nom: progress.nom, expiresAt: progress.expiresAt, activeIds: progress.activeIds },
      answers: progress.answers || {},
      stepIndex: progress.stepIndex || 0,
      writing: progress.writing || { promptId: "A", text: "" },
    };
  }
  if (progress) clearProgress();
  return { phase: "intro" };
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const slide = {
  enter: (dir) => ({ opacity: 0, x: dir * 36 }),
  center: { opacity: 1, x: 0 },
  exit: (dir) => ({ opacity: 0, x: dir * -36 }),
};

function BlockedScreen({ info, onViewResult, viewing }) {
  const sameDevice = info.sameDevice;
  return (
    <div className="mx-auto max-w-lg pt-8 text-center sm:pt-14">
      <motion.span
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white text-ebp-blue shadow-card ring-1 ring-ebp-blue/10"
      >
        <Lock size={32} />
      </motion.span>
      <h1 className="mt-6 font-display text-3xl font-bold text-ink">
        {info.message ? "Test indisponible" : "Ce test a déjà été passé"}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-ink/60">
        {info.message ||
          (sameDevice
            ? "Un test ne peut être passé qu'une seule fois par téléphone. Votre résultat est conservé."
            : "Ce numéro ou ce téléphone a déjà passé le test. Un seul test est possible pour chaque personne.")}
      </p>
      <div className="mt-8 space-y-3">
        {info.attemptId && (
          <button
            type="button"
            onClick={onViewResult}
            disabled={viewing}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ebp-blue px-6 py-4 text-base font-bold text-white shadow-[0_16px_30px_-12px_rgba(0,43,154,0.7)] transition hover:bg-ebp-blue-dark active:scale-[0.98] disabled:opacity-60"
          >
            <Eye size={18} />
            {viewing ? "Chargement…" : "Revoir mon résultat"}
          </button>
        )}
        <a
          href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelRetake)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-base font-bold text-ebp-blue shadow-sm ring-1 ring-ebp-blue/20 transition hover:bg-ebp-blue/5"
        >
          <MessageCircle size={18} />
          Contacter le secrétariat
        </a>
        <Link to="/" className="block pt-2 text-sm font-semibold text-ink/50 hover:text-ebp-blue">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}

function SubmittingScreen() {
  return (
    <div className="mx-auto max-w-md pt-16 text-center sm:pt-24">
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white shadow-card ring-1 ring-ebp-blue/10"
      >
        <Waveform barClassName="w-1.5 h-9" />
      </motion.div>
      <h1 className="mt-8 font-display text-2xl font-bold text-ink">Calcul de votre niveau…</h1>
      <p className="mt-2 text-ink/55">Nous analysons vos réponses, encore quelques secondes.</p>
    </div>
  );
}

function ConfirmDialog({ open, answered, total, onCancel, onConfirm }) {
  const missing = total - answered;
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-4 backdrop-blur-sm sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[2rem] bg-white p-7 text-center shadow-2xl"
          >
            <span
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
                missing > 0 ? "bg-amber-50 text-amber-600" : "bg-ebp-green/10 text-ebp-green"
              }`}
            >
              {missing > 0 ? <AlertTriangle size={26} /> : <CheckCircle2 size={26} />}
            </span>
            <h2 id="confirm-title" className="mt-4 font-display text-xl font-bold text-ink">
              Terminer le test ?
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              Vous avez répondu à <strong className="text-ink">{answered}</strong> question{answered > 1 ? "s" : ""} sur {total}.
              {missing > 0 ? ` Il en reste ${missing} sans réponse : vous pouvez encore y revenir.` : " Tout est prêt !"}
            </p>
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full rounded-full bg-ebp-blue px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_28px_-12px_rgba(0,43,154,0.7)] transition hover:bg-ebp-blue-dark active:scale-[0.98]"
              >
                Terminer et voir mon résultat
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full rounded-full px-6 py-3 text-sm font-semibold text-ink/60 transition hover:bg-ebp-blue/5 hover:text-ebp-blue"
              >
                Revenir au test
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LevelTest() {
  const [boot] = useState(readInitial);
  const [phase, setPhase] = useState(boot.phase);
  const [session, setSession] = useState(boot.session || null);
  const [answers, setAnswers] = useState(boot.answers || {});
  const [stepIndex, setStepIndex] = useState(boot.stepIndex || 0);
  const [direction, setDirection] = useState(1);
  const [writing, setWriting] = useState(boot.writing || { promptId: "A", text: "" });
  const [result, setResult] = useState(boot.result || null);
  const [blocked, setBlocked] = useState(null);
  const [viewing, setViewing] = useState(false);
  const [startError, setStartError] = useState("");
  const [starting, setStarting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState("");
  const submittingRef = useRef(false);
  const shownMilestones = useRef(new Set());

  const steps = useMemo(() => buildSteps(session?.activeIds), [session]);
  const questionSteps = useMemo(() => steps.filter((s) => s.type === "question"), [steps]);
  const totalQuestions = questionSteps.length;
  const answeredCount = questionSteps.filter((s) => answers[s.question.id] !== undefined).length;
  const step = steps[Math.min(stepIndex, steps.length - 1)];
  const secondsLeft = useCountdown(session?.expiresAt, phase === "test");

  useEffect(() => {
    if (phase !== "test" || !session) return;
    saveProgress({ ...session, answers, stepIndex, writing });
  }, [phase, session, answers, stepIndex, writing]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [stepIndex, phase]);

  useEffect(() => {
    if (!totalQuestions) return;
    const ratio = answeredCount / totalQuestions;
    const reached = MILESTONES.find((m) => ratio >= m.at && !shownMilestones.current.has(m.at));
    MILESTONES.forEach((m) => {
      if (ratio >= m.at) shownMilestones.current.add(m.at);
    });
    if (!reached) return undefined;
    setToast(reached.text);
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [answeredCount, totalQuestions]);

  const finish = useCallback(async () => {
    if (submittingRef.current || !session) return;
    submittingRef.current = true;
    setConfirmOpen(false);
    setSubmitError("");
    setPhase("submitting");
    try {
      const [res] = await Promise.all([
        submitTest({ attemptId: session.attemptId, answers, redaction: writing.text }),
        delay(1400),
      ]);
      if (res?.status === "ok") {
        saveResult(session.attemptId, res);
        clearProgress();
        setResult(res);
        setPhase("result");
        return;
      }
      const code = res?.code || "invalid";
      setSubmitError(SUBMIT_ERRORS[code] || SUBMIT_ERRORS.invalid);
      if (code === "too_fast") {
        setPhase("test");
      } else {
        clearProgress();
        setBlocked({ sameDevice: true, message: SUBMIT_ERRORS[code] || SUBMIT_ERRORS.invalid });
        setPhase("blocked");
      }
    } catch (err) {
      setSubmitError(err.message);
      setPhase("test");
    } finally {
      submittingRef.current = false;
    }
  }, [session, answers, writing.text]);

  useEffect(() => {
    if (phase === "test" && secondsLeft === 0) finish();
  }, [phase, secondsLeft, finish]);

  const handleStart = async ({ nom, whatsapp, honeypot }) => {
    setStartError("");
    setStarting(true);
    try {
      const res = await startTest({ nom, whatsapp, honeypot });
      if (res.status === "ok" || res.status === "resume") {
        const previous = loadProgress();
        const sameAttempt = previous?.attemptId === res.attempt_id;
        setSession({
          attemptId: res.attempt_id,
          nom: res.nom || nom,
          expiresAt: Date.now() + res.seconds_left * 1000,
          activeIds: res.active_ids,
        });
        setAnswers(sameAttempt ? previous.answers || {} : {});
        setStepIndex(sameAttempt ? previous.stepIndex || 0 : 0);
        setWriting(sameAttempt && previous.writing ? previous.writing : { promptId: "A", text: "" });
        setDirection(1);
        setPhase("test");
      } else if (res.status === "already") {
        setBlocked({ sameDevice: Boolean(res.same_device), attemptId: res.attempt_id });
        setPhase("blocked");
      } else {
        setStartError(START_ERRORS[res.code] || START_ERRORS.invalid);
      }
    } catch (err) {
      setStartError(err.message);
    } finally {
      setStarting(false);
    }
  };

  const handleViewResult = async () => {
    setViewing(true);
    try {
      const res = await fetchResult(blocked.attemptId);
      if (res?.status === "ok") {
        saveResult(blocked.attemptId, res);
        setResult(res);
        setPhase("result");
      } else {
        setBlocked({ ...blocked, attemptId: null, message: "Votre résultat n'est plus disponible sur cet appareil. Contactez le secrétariat." });
      }
    } catch (err) {
      setBlocked({ ...blocked, message: err.message });
    } finally {
      setViewing(false);
    }
  };

  const goTo = (index) => {
    setDirection(index >= stepIndex ? 1 : -1);
    setStepIndex(Math.max(0, Math.min(index, steps.length - 1)));
  };
  const goNext = () => goTo(stepIndex + 1);
  const goPrev = () => {
    let target = stepIndex - 1;
    while (target > 0 && steps[target].type === "section") target -= 1;
    goTo(target);
  };

  const questionNumber = step?.type === "question" ? questionSteps.findIndex((s) => s.question.id === step.question.id) + 1 : 0;
  const sectionNumber = step?.type === "section" ? steps.filter((s, i) => s.type === "section" && i <= stepIndex).length : 0;

  const setAnswer = useCallback(
    (questionId, choice) => setAnswers((prev) => ({ ...prev, [questionId]: choice })),
    []
  );

  const stepKey = step?.type === "question" ? step.question.id : step ? `${step.type}-${step.skill || ""}` : "none";

  return (
    <Shell right={phase === "test" ? <TimerPill secondsLeft={secondsLeft} /> : null}>
      <Seo
        title="Test de niveau d'anglais gratuit"
        description="Passez le test de niveau d'anglais EBP en ligne : résultat immédiat, du niveau débutant (A1) au niveau avancé (C2)."
        path="/test-de-niveau"
      />

      <AnimatePresence>{toast && phase === "test" && <Milestone message={toast} />}</AnimatePresence>

      {phase === "intro" && <IntroScreen onStart={handleStart} busy={starting} error={startError} />}

      {phase === "blocked" && blocked && <BlockedScreen info={blocked} onViewResult={handleViewResult} viewing={viewing} />}

      {phase === "submitting" && <SubmittingScreen />}

      {phase === "result" && result && <ResultScreen result={result} />}

      {phase === "test" && step && (
        <>
          {submitError && (
            <div role="alert" className="mx-auto mb-4 flex max-w-2xl items-start gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-ebp-red-soft">
              <RefreshCw size={16} className="mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={stepKey}
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {step.type === "section" && <SectionScreen skill={step.skill} number={sectionNumber} count={step.count} onStart={goNext} />}
              {step.type === "question" && (
                <QuestionScreen
                  question={step.question}
                  number={questionNumber}
                  total={totalQuestions}
                  answer={answers[step.question.id]}
                  onAnswer={(choice) => setAnswer(step.question.id, choice)}
                  onNext={goNext}
                  onPrev={goPrev}
                  canPrev={stepIndex > 1}
                />
              )}
              {step.type === "writing" && (
                <WritingScreen
                  promptId={writing.promptId}
                  text={writing.text}
                  onPrompt={(promptId) => setWriting((w) => ({ ...w, promptId }))}
                  onText={(text) => setWriting((w) => ({ ...w, text }))}
                  onPrev={goPrev}
                  onFinish={() => setConfirmOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </>
      )}

      <ConfirmDialog open={confirmOpen} answered={answeredCount} total={totalQuestions} onCancel={() => setConfirmOpen(false)} onConfirm={finish} />
    </Shell>
  );
}

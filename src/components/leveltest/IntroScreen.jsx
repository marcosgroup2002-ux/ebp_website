import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Clock, Gift, ShieldCheck, Sparkles, Headphones, Wifi } from "lucide-react";

const rise = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] },
});

const PERKS = [
  { icon: Clock, title: "≈ 45 minutes", text: "À votre rythme" },
  { icon: Sparkles, title: "Résultat immédiat", text: "Dès la dernière question" },
  { icon: Gift, title: "100 % gratuit", text: "Sans engagement" },
];

const field =
  "mt-1.5 w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink/35 transition focus:border-ebp-blue focus:outline-none focus:ring-4 focus:ring-ebp-blue/10";

export default function IntroScreen({ onStart, busy, error }) {
  const [nom, setNom] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [touched, setTouched] = useState(false);

  const nomOk = nom.trim().length >= 2;
  const phoneOk = whatsapp.replace(/\D/g, "").length >= 8;
  const canSubmit = nomOk && phoneOk && consent && !busy;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!canSubmit) return;
    onStart({ nom: nom.trim(), whatsapp: whatsapp.trim(), honeypot });
  };

  return (
    <div className="mx-auto max-w-xl pt-2 sm:pt-6">
      <motion.div {...rise(0)} className="text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-ebp-blue shadow-sm ring-1 ring-ebp-blue/15">
          <Sparkles size={13} />
          Test de niveau d'anglais
        </span>
        <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-ink sm:text-[2.6rem]">
          Découvrez votre <span className="text-ebp-blue">niveau d'anglais</span>
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-ink/60">
          Un test progressif, du niveau débutant au niveau avancé. Pas de pression : répondez simplement avec ce que vous savez.
        </p>
      </motion.div>

      <motion.ul {...rise(0.1)} className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-2xl bg-white/80 p-3 text-center shadow-sm ring-1 ring-ink/5 backdrop-blur sm:p-4">
            <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
              <Icon size={17} />
            </span>
            <p className="mt-2 text-xs font-bold text-ink sm:text-sm">{title}</p>
            <p className="mt-0.5 text-[11px] text-ink/50 sm:text-xs">{text}</p>
          </li>
        ))}
      </motion.ul>

      <motion.form
        {...rise(0.2)}
        onSubmit={submit}
        noValidate
        className="mt-6 rounded-[2rem] bg-white p-6 shadow-card ring-1 ring-ink/5 sm:p-8"
      >
        <label htmlFor="test-nom" className="block text-sm font-semibold text-ink">
          Votre nom complet
        </label>
        <input
          id="test-nom"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          autoComplete="name"
          maxLength={120}
          placeholder="Ex : Koffi Mensah"
          aria-invalid={touched && !nomOk}
          className={field}
        />
        {touched && !nomOk && <p className="mt-1.5 text-xs text-ebp-red-soft">Indiquez votre nom complet.</p>}

        <label htmlFor="test-whatsapp" className="mt-5 block text-sm font-semibold text-ink">
          Votre numéro WhatsApp
        </label>
        <input
          id="test-whatsapp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          maxLength={25}
          placeholder="Ex : 01 96 84 02 96"
          aria-invalid={touched && !phoneOk}
          className={field}
        />
        <p className="mt-1.5 text-xs text-ink/45">Pour vous envoyer votre résultat et vous conseiller. Un seul test par numéro.</p>
        {touched && !phoneOk && <p className="mt-1 text-xs text-ebp-red-soft">Indiquez un numéro valide (8 chiffres minimum).</p>}

        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Ne pas remplir
            <input tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm text-ink/65">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded accent-ebp-blue"
          />
          <span>J'accepte que l'équipe EBP me contacte sur WhatsApp au sujet de mon résultat.</span>
        </label>
        {touched && !consent && <p className="mt-1.5 text-xs text-ebp-red-soft">Cochez cette case pour continuer.</p>}

        {error && (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-ebp-red-soft">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ebp-blue px-6 py-4 text-base font-bold text-white shadow-[0_16px_30px_-12px_rgba(0,43,154,0.7)] transition hover:bg-ebp-blue-dark active:scale-[0.98] disabled:opacity-60"
        >
          {busy ? "Un instant…" : "Commencer le test"}
          {!busy && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
        </button>
      </motion.form>

      <motion.ul {...rise(0.3)} className="mt-6 space-y-2.5 px-2 text-sm text-ink/55">
        <li className="flex items-center gap-3">
          <ShieldCheck size={16} className="shrink-0 text-ebp-blue" />
          Une seule tentative par téléphone : prenez un moment au calme.
        </li>
        <li className="flex items-center gap-3">
          <Headphones size={16} className="shrink-0 text-ebp-blue" />
          Des écouteurs peuvent être utiles selon les parties.
        </li>
        <li className="flex items-center gap-3">
          <Wifi size={16} className="shrink-0 text-ebp-blue" />
          Si la connexion coupe, vos réponses sont conservées sur ce téléphone.
        </li>
      </motion.ul>
    </div>
  );
}

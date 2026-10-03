import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";
import {
  FOUNDER_NAME,
  CREED_PRINCIPLES,
  CULTURE_VALUES,
  PHILOSOPHY_QUOTE,
} from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import Waveform from "../components/Waveform";
import Seo from "../components/Seo";

export default function About() {
  return (
    <>
      <Seo
        title="À propos"
        description="Découvrez la mission et la méthode d'EBP (English for Busy People) : des cohortes de 6 mois pensées pour que les professionnels de Cotonou et Calavi parlent anglais, pas seulement qu'ils l'apprennent."
        path="/a-propos"
      />
      {/* Banner */}
      <section className="relative flex min-h-[55vh] items-end overflow-hidden bg-ink">
        <img
          src={img(MEDIA.about.team, { w: 1920, q: 65 })}
          alt="L'équipe et la communauté EBP"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div className="container relative pb-16 pt-40">
          <span className="eyebrow text-ebp-green-light">
            <Waveform color="bg-ebp-green-light" barClassName="w-[2.5px] h-3" />
            À propos d'EBP
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold text-white sm:text-5xl">
            Une méthode pensée pour que vous parliez, pas seulement pour que vous appreniez.
          </h1>
        </div>
      </section>

      {/* Founder / mission */}
      <section className="section-pad bg-white">
        <div className="container grid gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="eyebrow">Notre mission</span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
              Donner à chaque professionnel les moyens de parler anglais sans hésitation
            </h2>
            <p className="mt-5 text-ink/65">
              English for Busy People (EBP) est un centre d'apprentissage de l'anglais accéléré, fondé
              par <strong className="text-ink">{FOUNDER_NAME}</strong>, dédié aux professionnels, cadres,
              entrepreneurs et étudiants de Cotonou, Calavi et de la diaspora francophone.
            </p>
            <p className="mt-4 text-ink/65">
              La méthode EBP repose sur des cohortes de 6 mois, un double format d'enseignement
              (présentiel et en ligne) et surtout sur une conviction simple : on n'apprend pas à parler
              une langue en la regardant, mais en la pratiquant.
            </p>
            <blockquote className="mt-6 border-l-4 border-ebp-green pl-4 font-display text-lg italic text-ink">
              "{PHILOSOPHY_QUOTE}"
            </blockquote>
          </div>
          <div className="relative">
            <img
              src={img(MEDIA.about.portrait1, { w: 900, q: 75 })}
              alt={`${FOUNDER_NAME}, Fondateur et Directeur Général d'EBP`}
              className="aspect-[4/5] w-full rounded-3xl object-cover object-top shadow-card"
            />
            <div className="absolute -bottom-5 left-5 right-5 rounded-2xl border border-ink/5 bg-white p-4 shadow-card sm:left-6 sm:right-auto sm:w-64">
              <p className="font-display text-sm font-bold text-ink">{FOUNDER_NAME}</p>
              <p className="text-xs text-ink/60">Fondateur & Directeur Général</p>
            </div>
          </div>
        </div>
      </section>

      {/* Culture values */}
      <section className="section-pad bg-surface">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">Notre culture</span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
              Excellence. Engagement. Impact.
            </h2>
            <p className="mt-4 text-ink/60">
              Trois mots que toute personne qui rejoint l'équipe EBP doit incarner, pas seulement
              connaître.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2">
            {CULTURE_VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl border border-ink/10 bg-white p-6">
                <h3 className="font-display text-base font-semibold text-ink">{value.title}</h3>
                <p className="mt-2 text-sm text-ink/60">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creed */}
      <section className="section-pad bg-white">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">
              <Sparkles size={13} className="text-ebp-green" />
              Le Creed EBP
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">Les principes qui nous guident</h2>
          </div>

          <div className="mx-auto mt-12 grid max-w-3xl gap-3 sm:grid-cols-2">
            {CREED_PRINCIPLES.map((principle, i) => (
              <motion.div
                key={principle}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, delay: i * 0.04 }}
                className="flex items-start gap-3 rounded-xl bg-surface px-4 py-3.5"
              >
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-[11px] font-bold text-ebp-blue">
                  {i + 1}
                </span>
                <p className="text-sm text-ink/75">{principle}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ebp-blue">
        <div className="container flex flex-col items-center gap-5 py-14 text-center">
          <h2 className="font-display text-2xl font-bold text-white sm:text-3xl">
            Envie de rejoindre la prochaine cohorte ?
          </h2>
          <a
            href={buildWhatsAppLink(WHATSAPP_MESSAGES.levelTest)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <MessageCircle size={16} />
            Passer le Test de Niveau
          </a>
        </div>
      </section>
    </>
  );
}

import { useForm } from "react-hook-form";
import { MapPin, Mail, MessageCircle, Clock, Navigation, ExternalLink, Monitor, Landmark } from "lucide-react";
import {
  CONTACT_INFO,
  WHATSAPP_DISPLAY,
  mapsDirectionsLink,
  mapsEmbedUrl,
  mapsLink,
} from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import { isValidEmailOrPhone } from "../lib/validation";
import Waveform from "../components/Waveform";
import Seo from "../components/Seo";

function CenterCard({ center }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-soft">
      <div className="relative h-56 bg-surface sm:h-64">
        <iframe
          title={`Carte Google Maps du ${center.name}`}
          src={mapsEmbedUrl(center.coordinates)}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full border-0"
          allowFullScreen
        />
        <span className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ebp-blue px-3 py-1.5 text-xs font-semibold text-white shadow-card">
          <MapPin size={13} />
          {center.shortName}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-display text-lg font-bold text-ink">{center.name}</h3>
        <p className="mt-1 text-sm text-ink/60">{center.address}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/45">
          <Clock size={12} />
          {center.hours}
        </p>

        <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-ebp-green/10 px-4 py-3 text-sm text-ink">
          <Landmark size={16} className="mt-0.5 shrink-0 text-ebp-green" />
          <span>{center.landmark}</span>
        </div>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-ebp-blue">Comment nous trouver</p>
        <ol className="mt-3 space-y-3">
          {center.directions.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm leading-relaxed text-ink/70">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-xs font-bold text-ebp-blue">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <a
            href={mapsDirectionsLink(center.coordinates)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex-1 justify-center"
          >
            <Navigation size={15} />
            Itinéraire
          </a>
          <a
            href={mapsLink(center.coordinates)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-ink/10 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ebp-blue hover:text-ebp-blue"
          >
            <ExternalLink size={15} />
            Ouvrir dans Google Maps
          </a>
        </div>
      </div>
    </article>
  );
}

export default function Contact() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const onSubmit = (data) => {
    const message = `Bonjour EBP !\nNom : ${data.name}\nContact : ${data.contact}\nMessage : ${data.message}`;
    window.open(buildWhatsAppLink(message), "_blank", "noopener,noreferrer");
    reset();
  };

  return (
    <>
      <Seo
        title="Contact"
        description="Contactez EBP (English for Busy People) : centres à Cotonou (Vedoko) et Calavi (Zogbadjè), WhatsApp, email. Réponse sous 5 minutes."
        path="/contact"
      />
      <section className="relative flex min-h-[42vh] items-end overflow-hidden bg-ink">
        <img
          src={img(MEDIA.contact.banner, { w: 1920, q: 60 })}
          alt="L'équipe EBP à votre écoute"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div className="container relative pb-14 pt-32">
          <span className="eyebrow text-ebp-green-light">
            <Waveform color="bg-ebp-green-light" barClassName="w-[2.5px] h-3" />
            Contact
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Parlons-en</h1>
          <p className="mt-3 max-w-xl text-white/70">
            Passez nous voir à Cotonou ou à Calavi, écrivez-nous sur WhatsApp ou rejoignez-nous en ligne.
          </p>
        </div>
      </section>

      <section className="section-pad bg-surface">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow justify-center">
              <Waveform barClassName="w-[2.5px] h-3" />
              Nos centres
            </span>
            <h2 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">Venez nous rencontrer</h2>
            <p className="mt-4 text-ink/60">
              Deux centres pour vous accueillir. Suivez l'itinéraire Google Maps ou les indications ci-dessous.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {CONTACT_INFO.centers.map((center) => (
              <CenterCard key={center.id} center={center} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container grid gap-12 lg:grid-cols-[1fr,1.1fr]">
          <div className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Une question ? Écrivez-nous</h2>
            <p className="text-sm text-ink/60">Notre équipe vous répond rapidement, du lundi au samedi.</p>

            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.general)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-ink/10 p-5 transition-colors hover:border-ebp-green"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ebp-green/10 text-ebp-green">
                <MessageCircle size={18} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">WhatsApp</p>
                <p className="mt-0.5 text-sm text-ink/60">{WHATSAPP_DISPLAY} · réponse sous 5 minutes</p>
              </div>
            </a>

            <a
              href={`mailto:${CONTACT_INFO.email}`}
              className="flex items-center gap-4 rounded-2xl border border-ink/10 p-5 transition-colors hover:border-ebp-blue"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
                <Mail size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-ink">Email</p>
                <p className="mt-0.5 break-all text-sm text-ink/60">{CONTACT_INFO.email}</p>
              </div>
            </a>

            <div className="flex items-center gap-4 rounded-2xl border border-ink/10 p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
                <Monitor size={18} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">{CONTACT_INFO.online.name}</p>
                <p className="mt-0.5 text-sm text-ink/60">{CONTACT_INFO.online.address}</p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/45">
                  <Clock size={12} />
                  {CONTACT_INFO.online.hours}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-ink/10 bg-surface p-7 sm:p-9">
            <p className="font-display text-lg font-semibold text-ink">Envoyez-nous un message</p>
            <p className="mt-1 text-sm text-ink/50">Votre message s'ouvrira directement dans WhatsApp, prêt à envoyer.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/50">Nom complet</label>
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  placeholder="Votre nom"
                  {...register("name", {
                    required: "Ce champ est requis.",
                    minLength: { value: 2, message: "Le nom doit contenir au moins 2 caractères." },
                    maxLength: { value: 80, message: "Le nom est trop long." },
                  })}
                />
                {errors.name && <p className="mt-1 text-xs text-ebp-red-soft">{errors.name.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/50">WhatsApp ou email</label>
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  placeholder="01 96 84 02 96 ou vous@exemple.com"
                  {...register("contact", {
                    required: "Ce champ est requis.",
                    validate: (value) =>
                      isValidEmailOrPhone(value) || "Entrez un numéro (8 à 15 chiffres) ou un email valide.",
                  })}
                />
                {errors.contact && <p className="mt-1 text-xs text-ebp-red-soft">{errors.contact.message}</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/50">Message</label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  placeholder="Votre question ou votre objectif avec l'anglais..."
                  {...register("message", {
                    required: "Ce champ est requis.",
                    minLength: { value: 10, message: "Décrivez votre demande en quelques mots de plus (10 caractères min.)." },
                    maxLength: { value: 1000, message: "Le message est trop long (1000 caractères max.)." },
                  })}
                />
                {errors.message && <p className="mt-1 text-xs text-ebp-red-soft">{errors.message.message}</p>}
              </div>
            </div>

            <button type="submit" className="btn-primary mt-6 w-full">
              <MessageCircle size={16} />
              Envoyer via WhatsApp
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

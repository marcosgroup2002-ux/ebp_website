import { useForm } from "react-hook-form";
import { MapPin, Mail, MessageCircle, Clock } from "lucide-react";
import { CONTACT_INFO, WHATSAPP_DISPLAY } from "../data/siteContent";
import { MEDIA, img } from "../data/media";
import { buildWhatsAppLink } from "../lib/whatsapp";
import Waveform from "../components/Waveform";

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
      <section className="relative flex min-h-[42vh] items-end overflow-hidden bg-ink">
        <img
          src={img(MEDIA.contact.banner, { w: 1920, q: 60 })}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
        <div className="container relative pb-14 pt-32">
          <span className="eyebrow text-ebp-green-light">
            <Waveform color="bg-ebp-green-light" barClassName="w-[2.5px] h-3" />
            Contact
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">Parlons-en</h1>
        </div>
      </section>

      <section className="section-pad bg-white">
        <div className="container grid gap-12 lg:grid-cols-[1fr,1.1fr]">
          {/* Centers */}
          <div className="space-y-4">
            {CONTACT_INFO.centers.map((center) => (
              <div key={center.name} className="flex items-start gap-4 rounded-2xl border border-ink/10 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
                  <MapPin size={17} />
                </span>
                <div>
                  <p className="font-display text-sm font-semibold text-ink">{center.name}</p>
                  <p className="mt-0.5 text-sm text-ink/60">{center.address}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/45">
                    <Clock size={12} />
                    {center.hours}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex items-center gap-4 rounded-2xl border border-ink/10 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ebp-green/10 text-ebp-green">
                <MessageCircle size={17} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">WhatsApp</p>
                <p className="mt-0.5 text-sm text-ink/60">{WHATSAPP_DISPLAY} · réponse sous 5 minutes</p>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-2xl border border-ink/10 p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ebp-blue/10 text-ebp-blue">
                <Mail size={17} />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-ink">Email</p>
                <p className="mt-0.5 text-sm text-ink/60">{CONTACT_INFO.email}</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-3xl border border-ink/10 bg-surface p-7 sm:p-9">
            <p className="font-display text-lg font-semibold text-ink">Envoyez-nous un message</p>
            <p className="mt-1 text-sm text-ink/50">Votre message s'ouvrira directement dans WhatsApp, prêt à envoyer.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/50">Nom complet</label>
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  placeholder="Votre nom"
                  {...register("name", { required: true })}
                />
                {errors.name && <p className="mt-1 text-xs text-ebp-red-soft">Ce champ est requis.</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/50">WhatsApp ou email</label>
                <input
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  placeholder="01 90 00 00 00"
                  {...register("contact", { required: true })}
                />
                {errors.contact && <p className="mt-1 text-xs text-ebp-red-soft">Ce champ est requis.</p>}
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-ink/50">Message</label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-ink/10 bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
                  placeholder="Votre question ou votre objectif avec l'anglais..."
                  {...register("message", { required: true })}
                />
                {errors.message && <p className="mt-1 text-xs text-ebp-red-soft">Ce champ est requis.</p>}
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

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play, GraduationCap, Images, ChevronLeft, ChevronRight, X, ArrowRight, Sparkles } from "lucide-react";
import { GRADUATION_ALBUM_URL, GRADUATION_PHOTOS, GRADUATION_VIDEOS } from "../data/siteContent";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";
import Waveform from "./Waveform";

const CONFETTI = [
  { left: "6%", top: "12%", color: "bg-ebp-red-soft", size: "h-2 w-2", delay: 0 },
  { left: "18%", top: "70%", color: "bg-ebp-green-light", size: "h-3 w-3", delay: 0.6 },
  { left: "32%", top: "8%", color: "bg-white", size: "h-1.5 w-1.5", delay: 1.2 },
  { left: "54%", top: "18%", color: "bg-ebp-green-light", size: "h-2 w-2", delay: 0.3 },
  { left: "72%", top: "6%", color: "bg-ebp-red-soft", size: "h-2.5 w-2.5", delay: 0.9 },
  { left: "88%", top: "26%", color: "bg-white", size: "h-2 w-2", delay: 1.5 },
  { left: "94%", top: "64%", color: "bg-ebp-red-soft", size: "h-1.5 w-1.5", delay: 0.4 },
  { left: "44%", top: "92%", color: "bg-white", size: "h-2 w-2", delay: 1.1 },
];

// Mosaïque : la première photo occupe un grand bloc, les portraits prennent deux rangées.
const TILE_CLASSES = [
  "col-span-2 row-span-2",
  "row-span-2",
  "",
  "",
  "row-span-2",
  "col-span-2",
  "row-span-2",
  "",
  "",
];

function thumbnail(id) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

function VideoPlayer({ video, playing, onPlay }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-3xl bg-ink shadow-2xl ring-1 ring-white/10">
      {playing ? (
        <iframe
          key={video.id}
          title={video.title}
          src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      ) : (
        <button type="button" onClick={onPlay} className="group absolute inset-0" aria-label={`Lire : ${video.title}`}>
          <img src={thumbnail(video.id)} alt="" className="h-full w-full scale-[1.02] object-cover transition duration-500 group-hover:scale-105" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white text-ebp-blue shadow-card transition group-hover:scale-110">
              <Play size={30} className="ml-1" fill="currentColor" />
            </span>
          </span>
          <span className="absolute bottom-0 left-0 right-0 p-5 text-left sm:p-7">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ebp-green px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
              <GraduationCap size={13} />
              {video.label}
            </span>
            <span className="mt-2 block font-display text-lg font-bold text-white sm:text-2xl">{video.title}</span>
          </span>
        </button>
      )}
    </div>
  );
}

function Lightbox({ index, onClose, onPrev, onNext }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, onPrev, onNext]);

  const photo = GRADUATION_PHOTOS[index];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/95 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={photo.alt}
    >
      <motion.img
        key={photo.src}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        src={photo.src}
        alt={photo.alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
      />
      <p className="absolute bottom-5 left-0 right-0 px-6 text-center text-sm text-white/70">
        {photo.alt} · {index + 1}/{GRADUATION_PHOTOS.length}
      </p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        aria-label="Photo précédente"
        className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        aria-label="Photo suivante"
        className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <ChevronRight size={22} />
      </button>
    </motion.div>
  );
}

export default function GraduationSection() {
  const [activeVideo, setActiveVideo] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(null);
  const photoCount = GRADUATION_PHOTOS.length;

  const closeLightbox = useCallback(() => setPhotoIndex(null), []);
  const prevPhoto = useCallback(() => setPhotoIndex((i) => (i - 1 + photoCount) % photoCount), [photoCount]);
  const nextPhoto = useCallback(() => setPhotoIndex((i) => (i + 1) % photoCount), [photoCount]);

  const selectVideo = (i) => {
    setActiveVideo(i);
    setPlaying(true);
  };

  return (
    <section
      id="graduation"
      className="relative overflow-hidden bg-gradient-to-br from-ebp-blue via-[#0a2a8a] to-ink py-20 text-white sm:py-28"
    >
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className={`pointer-events-none absolute rounded-full ${c.color} ${c.size} opacity-70`}
          style={{ left: c.left, top: c.top }}
          animate={{ y: [0, -14, 0], rotate: [0, 90, 180] }}
          transition={{ duration: 5, repeat: Infinity, delay: c.delay, ease: "easeInOut" }}
        />
      ))}

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="eyebrow justify-center text-ebp-green-light">
            <Waveform color="bg-ebp-green-light" barClassName="w-[2.5px] h-3" />
            Graduation & Projets Capstone
          </span>
          <h2 className="mt-4 text-3xl font-bold sm:text-5xl">
            Ils l'ont fait. <span className="text-ebp-green-light">Votre tour arrive.</span>
          </h2>
          <p className="mt-4 text-white/70">
            6 mois plus tard, ils prennent la parole en anglais devant un jury, leurs familles et leurs pairs.
            Regardez-les, en version intégrale.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.6fr,1fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <VideoPlayer
              video={GRADUATION_VIDEOS[activeVideo]}
              playing={playing}
              onPlay={() => setPlaying(true)}
            />
          </motion.div>

          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              <Sparkles size={14} className="text-ebp-green-light" />
              {GRADUATION_VIDEOS.length} vidéos complètes
            </p>
            {GRADUATION_VIDEOS.map((video, i) => (
              <button
                key={video.id}
                type="button"
                onClick={() => selectVideo(i)}
                aria-current={activeVideo === i}
                className={`group flex items-center gap-4 rounded-2xl p-2.5 text-left transition ${
                  activeVideo === i ? "bg-white text-ink shadow-card" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <span className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl">
                  <img src={thumbnail(video.id)} alt="" loading="lazy" className="h-full w-full scale-[1.35] object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/30">
                    <Play size={18} className="text-white" fill="currentColor" />
                  </span>
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-[10px] font-bold uppercase tracking-wider ${
                      activeVideo === i ? "text-ebp-green" : "text-ebp-green-light"
                    }`}
                  >
                    {video.label}
                  </span>
                  <span className="mt-0.5 block text-sm font-semibold leading-snug">{video.title}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-2xl font-bold">La cérémonie en images</p>
            <p className="mt-1 text-sm text-white/60">Remises d'attestations, discours et fierté partagée.</p>
          </div>
          <a
            href={GRADUATION_ALBUM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden shrink-0 items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10 sm:inline-flex"
          >
            <Images size={15} />
            Voir l'album complet
          </a>
        </div>

        <div className="mt-6 grid grid-flow-row-dense auto-rows-[130px] grid-cols-2 gap-3 sm:auto-rows-[170px] sm:grid-cols-4">
          {GRADUATION_PHOTOS.map((photo, i) => (
            <motion.button
              key={photo.src}
              type="button"
              onClick={() => setPhotoIndex(i)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 4) * 0.06 }}
              className={`group relative overflow-hidden rounded-2xl ${TILE_CLASSES[i] || ""}`}
              aria-label={`Agrandir : ${photo.alt}`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
              <span className="absolute bottom-2 left-3 right-3 text-left text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
                {photo.alt}
              </span>
            </motion.button>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6 }}
          className="mt-14 flex flex-col items-center gap-5 rounded-3xl bg-white/10 p-8 text-center ring-1 ring-white/15 backdrop-blur-sm sm:p-10"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ebp-green text-white shadow-card">
            <GraduationCap size={28} />
          </span>
          <p className="max-w-xl font-display text-2xl font-bold sm:text-3xl">
            Votre attestation vous attend sur cette scène.
          </p>
          <p className="max-w-lg text-white/70">
            Rejoignez la prochaine cohorte et préparez votre propre projet Capstone en anglais.
          </p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <a
              href={buildWhatsAppLink(WHATSAPP_MESSAGES.enroll)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ebp-green px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-ebp-green-light active:scale-[0.98]"
            >
              Je réserve ma place
              <ArrowRight size={16} />
            </a>
            <a
              href={GRADUATION_ALBUM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Images size={16} />
              Voir toutes les photos
            </a>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {photoIndex !== null && (
          <Lightbox index={photoIndex} onClose={closeLightbox} onPrev={prevPhoto} onNext={nextPhoto} />
        )}
      </AnimatePresence>
    </section>
  );
}

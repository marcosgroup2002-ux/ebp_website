import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, WHATSAPP_MESSAGES } from "../lib/whatsapp";

export default function WhatsAppFloatingButton() {
  return (
    <a
      href={buildWhatsAppLink(WHATSAPP_MESSAGES.general)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Écrire sur WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-ebp-green text-white shadow-[0_10px_30px_-8px_rgba(0,135,61,0.7)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:h-14 sm:w-14"
    >
      <span className="absolute inline-flex h-full w-full animate-pulseRing rounded-full bg-ebp-green" />
      <MessageCircle size={26} className="relative" />
    </a>
  );
}

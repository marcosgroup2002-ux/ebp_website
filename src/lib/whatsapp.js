import { WHATSAPP_NUMBER } from "../data/siteContent";

export function buildWhatsAppLink(message) {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`;
}

export const WHATSAPP_MESSAGES = {
  levelTest: "Bonjour EBP ! Je souhaite passer le Test de Niveau gratuit.",
  enroll: "Bonjour EBP ! Je souhaite m'inscrire et réserver ma place (acompte 20 000 F).",
  enrollWithContact: (contact) =>
    `Bonjour EBP ! Je souhaite démarrer mon inscription (20 000 F). Mon contact : ${contact}`,
  prospectus: "Bonjour EBP ! Pourriez-vous m'envoyer le prospectus du programme ?",
  bloc: "Bonjour EBP ! Je suis intéressé(e) par l'offre Paiement en Bloc à 150 000 F.",
  echelonne: "Bonjour EBP ! Je suis intéressé(e) par le Paiement Échelonné (60 000 F à l'inscription).",
  general: "Bonjour EBP ! J'aimerais avoir plus d'informations sur le programme.",
};

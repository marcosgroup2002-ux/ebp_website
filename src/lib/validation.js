// ============================================================================
// VALIDATION : helpers réutilisables pour les formulaires publics
// ============================================================================
// Regex volontairement pragmatiques (pas de RFC 5322 complet) : on veut
// attraper les fautes de saisie courantes sans bloquer des emails/numéros
// valides mais un peu inhabituels.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Accepte les formats courants au Bénin et à l'international :
// +229 01 96 84 02 96 / 0196840296 / 01-96-84-02-96 / etc.
// 8 à 15 chiffres, espaces/points/tirets tolérés, "+" optionnel en préfixe.
const PHONE_REGEX = /^\+?[0-9](?:[0-9\s.-]{6,17})[0-9]$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value).trim());
}

export function isValidPhone(value) {
  const digitsOnly = String(value).replace(/[\s.-]/g, "");
  const digitCount = digitsOnly.replace(/^\+/, "").length;
  return PHONE_REGEX.test(String(value).trim()) && digitCount >= 8 && digitCount <= 15;
}

// Pour le champ combiné "WhatsApp ou email" du formulaire de contact.
export function isValidEmailOrPhone(value) {
  return isValidEmail(value) || isValidPhone(value);
}

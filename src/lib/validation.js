
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const PHONE_REGEX = /^\+?[0-9](?:[0-9\s.-]{6,17})[0-9]$/;

export function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value).trim());
}

export function isValidPhone(value) {
  const digitsOnly = String(value).replace(/[\s.-]/g, "");
  const digitCount = digitsOnly.replace(/^\+/, "").length;
  return PHONE_REGEX.test(String(value).trim()) && digitCount >= 8 && digitCount <= 15;
}

export function isValidEmailOrPhone(value) {
  return isValidEmail(value) || isValidPhone(value);
}

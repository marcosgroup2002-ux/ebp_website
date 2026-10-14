import { supabase } from "../lib/supabaseClient";

const DEVICE_KEY = "ebp_test_device";
const PROGRESS_KEY = "ebp_test_progress";
const RESULT_KEY = "ebp_test_result";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const TEST_DURATION_SECONDS = 2700;

const store = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Stockage indisponible (navigation privée) : le test reste utilisable, sans reprise après fermeture.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Rien à supprimer.
    }
  },
};

function randomUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

let memoryDeviceId = null;

// Identifiant anonyme de ce téléphone : sert à limiter le test à une fois par appareil.
export function getDeviceId() {
  const saved = store.get(DEVICE_KEY);
  if (saved && UUID_REGEX.test(saved)) return saved;
  const id = memoryDeviceId || randomUuid();
  memoryDeviceId = id;
  store.set(DEVICE_KEY, id);
  return id;
}

export function loadProgress() {
  try {
    const raw = store.get(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProgress(progress) {
  store.set(PROGRESS_KEY, JSON.stringify(progress));
}

export function clearProgress() {
  store.remove(PROGRESS_KEY);
}

export function loadSavedResult() {
  try {
    const raw = store.get(RESULT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveResult(attemptId, result) {
  store.set(RESULT_KEY, JSON.stringify({ attemptId, result }));
}

const NETWORK_MESSAGE = "Connexion impossible pour le moment. Vérifiez votre réseau, vos réponses sont conservées.";

const REQUEST_TIMEOUT_MS = 20000;
const MAX_RETRIES = 2;

// Codes SQLSTATE qui valent la peine d'un nouvel essai (connexion, ressources saturées, redémarrage).
const RETRYABLE_SQLSTATE = /^(08|53|57)/;

function isRetryable(error) {
  return !error.code || RETRYABLE_SQLSTATE.test(error.code) || error.code.startsWith("PGRST3");
}

// Les fonctions du test sont idempotentes (démarrage = reprise, envoi = même résultat) : réessayer est sans risque.
async function call(name, args) {
  if (!supabase) throw new Error("Le test est momentanément indisponible. Réessayez dans quelques minutes.");
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const { data, error } = await supabase.rpc(name, args).abortSignal(controller.signal);
      if (!error) return data;
      if (!isRetryable(error)) break;
    } catch {
      // Coupure réseau ou délai dépassé : nouvel essai.
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(NETWORK_MESSAGE);
}

export function startTest({ nom, whatsapp, honeypot = "" }) {
  return call("level_test_start", {
    p_nom: nom,
    p_whatsapp: whatsapp,
    p_device_id: getDeviceId(),
    p_hp: honeypot,
  });
}

export function submitTest({ attemptId, answers, redaction }) {
  return call("level_test_submit", {
    p_attempt_id: attemptId,
    p_device_id: getDeviceId(),
    p_answers: answers,
    p_redaction: redaction || null,
  });
}

export function fetchResult(attemptId) {
  return call("level_test_get_result", { p_attempt_id: attemptId, p_device_id: getDeviceId() });
}

export const START_ERRORS = {
  invalid_name: "Indiquez votre nom complet (2 caractères minimum).",
  invalid_phone: "Indiquez un numéro WhatsApp valide (8 chiffres minimum).",
  invalid: "Une erreur est survenue. Rechargez la page puis réessayez.",
  rate_limited: "Beaucoup de personnes passent le test en ce moment. Réessayez dans quelques minutes.",
  unavailable: "Le test est momentanément indisponible. Réessayez dans quelques minutes.",
};

export const SUBMIT_ERRORS = {
  expired: "Le temps accordé est dépassé. Contactez le secrétariat pour reprendre le test.",
  not_allowed: "Ce test n'est plus actif. Contactez le secrétariat pour reprendre le test.",
  not_found: "Ce test est introuvable sur cet appareil. Contactez le secrétariat.",
  too_fast: "Prenez le temps de lire les questions, puis terminez à nouveau le test.",
  invalid: "Une erreur est survenue. Réessayez.",
};

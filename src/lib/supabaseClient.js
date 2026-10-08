import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error("[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquantes : l'espace admin est indisponible.");
}

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function requireSupabase() {
  if (!supabase) throw new Error("Service indisponible : configuration Supabase manquante.");
  return supabase;
}

export function toUserMessage(error, fallback = "Une erreur est survenue.") {
  if (!error) return fallback;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "Pas de connexion Internet. Vérifiez votre réseau puis réessayez.";
  }
  if (error.code === "42501" || /permission denied|non autorisée/i.test(error.message || "")) {
    return "Action non autorisée pour votre rôle.";
  }
  if (/JWT|token|session/i.test(error.message || "")) {
    return "Votre session a expiré. Veuillez vous reconnecter.";
  }
  return error.message || fallback;
}

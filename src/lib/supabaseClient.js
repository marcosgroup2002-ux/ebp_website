
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY absentes : voir .env.local.example. " +
      "L'espace admin reste sur le prototype par mot de passe hashé tant que ces variables ne sont pas définies."
  );
}

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

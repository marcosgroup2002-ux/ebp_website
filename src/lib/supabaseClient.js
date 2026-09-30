// ============================================================================
// CLIENT SUPABASE
// ============================================================================
// Lit l'URL du projet et la clé "anon public" depuis les variables
// d'environnement Vite (préfixe VITE_ obligatoire pour qu'elles soient
// exposées au bundle client — voir .env.local.example). La clé "anon" est
// FAITE pour être publique côté client : c'est la Row Level Security définie
// dans docs/schema.sql qui protège réellement les données, pas le secret de
// cette clé. La clé "service_role" (accès complet, contourne la RLS) ne doit
// JAMAIS apparaître ici ni dans aucun fichier commité.
//
// Tant que ces variables ne sont pas renseignées (projet Supabase pas encore
// créé), `supabase` reste `null` : voir docs/backend-integration.md pour la
// checklist de bascule.

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

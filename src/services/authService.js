import { requireSupabase, supabase, toUserMessage } from "../lib/supabaseClient";

const ROLES = ["secretaire", "coach", "pdg"];

export async function fetchProfile(userId) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("id, nom, role, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(toUserMessage(error, "Impossible de charger votre profil."));
  if (!data || !ROLES.includes(data.role)) return null;
  return { id: data.id, name: data.nom, email: data.email, role: data.role };
}

export async function signIn(email, password) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) {
    if (/invalid login credentials/i.test(error.message)) throw new Error("Email ou mot de passe incorrect.");
    if (/rate limit|too many/i.test(error.message)) throw new Error("Trop de tentatives. Patientez quelques minutes.");
    throw new Error(toUserMessage(error, "Connexion impossible."));
  }

  const profile = await fetchProfile(data.user.id);
  if (!profile) {
    await client.auth.signOut();
    throw new Error("Ce compte n'a aucun rôle attribué. Contactez la direction.");
  }

  const { error: notifyError } = await client.functions.invoke("auth-notify", { body: { event: "login" } });
  if (notifyError) console.warn("[authService] Journalisation de connexion indisponible :", notifyError.message);

  return profile;
}

export async function signOut() {
  if (!supabase) return;
  const { error: auditError } = await supabase.rpc("log_logout");
  if (auditError) console.warn("[authService] Journalisation de déconnexion indisponible :", auditError.message);
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(toUserMessage(error, "Déconnexion impossible."));
}

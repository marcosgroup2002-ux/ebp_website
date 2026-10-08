import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { fetchProfile, signIn as signInRequest, signOut as signOutRequest } from "../services/authService";

const AdminUserContext = createContext(null);

export function AdminUserProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    if (!supabase) return undefined;

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setSessionError("Session illisible, veuillez vous reconnecter.");
      setSession(data?.session ?? null);
      if (!data?.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "SIGNED_OUT" || !nextSession) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let active = true;
    setLoading(true);
    fetchProfile(userId)
      .then((profile) => {
        if (!active) return;
        if (!profile) {
          setSessionError("Ce compte n'a aucun rôle attribué. Contactez la direction.");
          supabase.auth.signOut();
          return;
        }
        setUser(profile);
        setSessionError("");
      })
      .catch((err) => {
        if (active) setSessionError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const signIn = useCallback(async (email, password) => {
    setSessionError("");
    const profile = await signInRequest(email, password);
    setUser(profile);
    return profile;
  }, []);

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
  }, []);

  return (
    <AdminUserContext.Provider value={{ user, session, loading, sessionError, signIn, signOut }}>
      {children}
    </AdminUserContext.Provider>
  );
}

export function useAdminUser() {
  const ctx = useContext(AdminUserContext);
  if (!ctx) throw new Error("useAdminUser must be used within AdminUserProvider");
  return ctx;
}

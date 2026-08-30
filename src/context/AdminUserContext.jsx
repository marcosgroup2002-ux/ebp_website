import { createContext, useContext, useState } from "react";

const AdminUserContext = createContext(null);
const STORAGE_KEY = "ebp_admin_user";

export function AdminUserProvider({ children }) {
  const [user, setUserState] = useState(() => {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const setUser = (u) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUserState(u);
  };

  const clearUser = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUserState(null);
  };

  return (
    <AdminUserContext.Provider value={{ user, setUser, clearUser }}>{children}</AdminUserContext.Provider>
  );
}

export function useAdminUser() {
  const ctx = useContext(AdminUserContext);
  if (!ctx) throw new Error("useAdminUser must be used within AdminUserProvider");
  return ctx;
}

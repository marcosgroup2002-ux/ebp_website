import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

// Le service (et la librairie Supabase) n'est chargé qu'une fois la page affichée,
// pour ne pas alourdir le premier affichage.
const loadAnalytics = () => import("../services/analyticsService");

const whenIdle = (callback) =>
  typeof window.requestIdleCallback === "function"
    ? window.requestIdleCallback(callback, { timeout: 4000 })
    : window.setTimeout(callback, 1500);

const cancelIdle = (id) =>
  typeof window.cancelIdleCallback === "function" ? window.cancelIdleCallback(id) : window.clearTimeout(id);

export default function AnalyticsTracker() {
  const location = useLocation();
  const trackedPathRef = useRef("");

  useEffect(() => {
    const currentPath = `${location.pathname}${location.search}`;
    if (trackedPathRef.current === currentPath) return undefined;
    trackedPathRef.current = currentPath;

    const handle = whenIdle(() => {
      loadAnalytics()
        .then(({ trackVisitorVisit }) => trackVisitorVisit())
        .catch((err) => {
          console.debug("[AnalyticsTracker] Erreur non bloquante:", err);
        });
    });

    return () => cancelIdle(handle);
  }, [location.pathname, location.search]);

  return null;
}

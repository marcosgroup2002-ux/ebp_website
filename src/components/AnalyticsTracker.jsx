import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackVisitorVisit } from "../services/analyticsService";

/**
 * Composant de tracking global invisible
 * S'exécute silencieusement dès le chargement de n'importe quelle page
 * Règle Machine Unique : 1 Appareil = 1 Compte dans Supabase
 */
export default function AnalyticsTracker() {
  const location = useLocation();
  const trackedPathRef = useRef("");

  useEffect(() => {
    // Évite les doubles envois sur la même page dans le même cycle de rendu
    const currentPath = `${location.pathname}${location.search}`;
    if (trackedPathRef.current === currentPath) return;
    trackedPathRef.current = currentPath;

    // Déclenchement asynchrone non-bloquant
    const timer = setTimeout(() => {
      trackVisitorVisit().catch((err) => {
        console.debug("[AnalyticsTracker] Erreur non bloquante:", err);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  // Composant 100% invisible
  return null;
}

"use client";

import { useEffect, useRef } from "react";
import { trackVisitorVisit } from "../services/analyticsService";

/**
 * Composant Client Global Tracker d'Audience EBP
 * À placer dans le root layout (ex: layout.tsx ou Layout.jsx)
 * Règle Machine Unique : 1 Appareil = 1 Compte dans Supabase (0 FCFA)
 */
export default function AnalyticsTracker() {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (trackedRef.current) return;
    trackedRef.current = true;

    // Déclenchement asynchrone non-bloquant
    const timer = setTimeout(() => {
      trackVisitorVisit().catch((err) => {
        console.debug("[AnalyticsTracker] Tracking error:", err);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

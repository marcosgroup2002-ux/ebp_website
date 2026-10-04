import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackVisitorVisit } from "../services/analyticsService";

export default function AnalyticsTracker() {
  const location = useLocation();
  const trackedPathRef = useRef("");

  useEffect(() => {

    const currentPath = `${location.pathname}${location.search}`;
    if (trackedPathRef.current === currentPath) return;
    trackedPathRef.current = currentPath;

    const timer = setTimeout(() => {
      trackVisitorVisit().catch((err) => {
        console.debug("[AnalyticsTracker] Erreur non bloquante:", err);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}

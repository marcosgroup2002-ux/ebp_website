"use client";

import { useEffect, useRef } from "react";
import { trackVisitorVisit } from "../services/analyticsService";

export default function AnalyticsTracker() {
  const trackedRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (trackedRef.current) return;
    trackedRef.current = true;

    const timer = setTimeout(() => {
      trackVisitorVisit().catch((err) => {
        console.debug("[AnalyticsTracker] Tracking error:", err);
      });
    }, 150);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

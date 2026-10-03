// ============================================================================
// SERVICE ANALYTICS EBP - SUIVI D'AUDIENCE & BOOSTS MARKETING (0 FCFA)
// Règle Machine Unique : 1 Appareil = 1 Seul Visiteur Comptabilisé
// ============================================================================

import { supabase } from "../lib/supabaseClient";

const VISITOR_ID_STORAGE_KEY = "ebp_visitor_id";
const TRACKED_FLAG_KEY = "ebp_analytics_tracked";

/**
 * Génère un UUID v4 standard
 */
function generateUUID() {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Récupère ou initialise l'identifiant machine unique (stocké dans localStorage)
 */
export function getOrCreateVisitorId() {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (!visitorId || visitorId.length < 10) {
      visitorId = generateUUID();
      localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return generateUUID();
  }
}

/**
 * Détecte le type d'appareil (mobile, tablet, desktop)
 */
function detectDeviceType() {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  const width = typeof window !== "undefined" ? window.innerWidth : 1200;

  const isTablet =
    /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(
      ua
    ) || (width >= 768 && width <= 1024);

  if (isTablet) return "tablet";

  const isMobile =
    /(mobile|ip(hone|od)|android|blackberry|iemobile|kindle|silk|opera mini)/i.test(
      ua
    ) || width < 768;

  if (isMobile) return "mobile";
  return "desktop";
}

/**
 * Détecte le système d'exploitation
 */
function detectOperatingSystem() {
  if (typeof navigator === "undefined") return "Inconnu";
  const ua = navigator.userAgent;

  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Android/i.test(ua)) return "Android";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  if (/CrOS/i.test(ua)) return "Chrome OS";
  return "Autre";
}

/**
 * Détecte le navigateur web
 */
function detectBrowser() {
  if (typeof navigator === "undefined") return "Inconnu";
  const ua = navigator.userAgent;

  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "Opera";
  if (/SamsungBrowser/i.test(ua)) return "Samsung Internet";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  if (/Firefox\//i.test(ua)) return "Firefox";
  return "Autre";
}

/**
 * Enregistre ou actualise le visiteur unique dans Supabase
 * Règle d'unicité : ON CONFLICT (visitor_id) DO NOTHING (ou incrément visits_count)
 */
export async function trackVisitorVisit(customParams = {}) {
  try {
    if (typeof window === "undefined") return null;

    const visitorId = getOrCreateVisitorId();
    const urlParams = new URLSearchParams(window.location.search);

    // Extraction des UTM (Facebook Boost, TikTok Ads, etc.)
    const utmSource =
      customParams.utm_source ||
      urlParams.get("utm_source") ||
      (document.referrer
        ? document.referrer.includes("facebook")
          ? "facebook"
          : document.referrer.includes("tiktok")
          ? "tiktok"
          : document.referrer.includes("instagram")
          ? "instagram"
          : document.referrer.includes("google")
          ? "google"
          : new URL(document.referrer, window.location.origin).hostname
        : "direct");

    const utmMedium =
      customParams.utm_medium || urlParams.get("utm_medium") || "none";
    const utmCampaign =
      customParams.utm_campaign || urlParams.get("utm_campaign") || "organic";
    const utmTerm = customParams.utm_term || urlParams.get("utm_term") || null;
    const utmContent =
      customParams.utm_content || urlParams.get("utm_content") || null;

    const deviceType = detectDeviceType();
    const operatingSystem = detectOperatingSystem();
    const browser = detectBrowser();
    const pagePath = window.location.pathname || "/";
    const referrer = document.referrer || "direct";

    const payload = {
      visitor_id: visitorId,
      device_type: deviceType,
      operating_system: operatingSystem,
      browser: browser,
      utm_source: utmSource.toLowerCase(),
      utm_medium: utmMedium.toLowerCase(),
      utm_campaign: utmCampaign.toLowerCase(),
      utm_term: utmTerm,
      utm_content: utmContent,
      page_path: pagePath,
      referrer: referrer.slice(0, 500),
      last_seen: new Date().toISOString(),
    };

    // 1. Envoi prioritaire direct via Supabase (client JS avec RLS)
    if (supabase) {
      const { data, error } = await supabase
        .from("analytics_visitors")
        .upsert(payload, {
          onConflict: "visitor_id",
          ignoreDuplicates: false, // Met à jour last_seen sans dupliquer le visiteur
        })
        .select("id, visitor_id")
        .maybeSingle();

      if (!error) {
        localStorage.setItem(TRACKED_FLAG_KEY, "true");
        return { success: true, data };
      }
      console.warn("[analyticsService] Supabase direct error, fallback API:", error.message);
    }

    // 2. Relai de secours vers l'endpoint serveur /api/analytics/track si disponible
    try {
      const response = await fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        localStorage.setItem(TRACKED_FLAG_KEY, "true");
        return { success: true };
      }
    } catch {
      //
    }

    return { success: false, visitorId };
  } catch (err) {
    console.error("[analyticsService] Erreur silencieuse de tracking:", err);
    return null;
  }
}

/**
 * Récupère les données et statistiques agrégées pour le Dashboard Admin
 */
export async function fetchAnalyticsData() {
  if (!supabase) {
    return {
      totalVisitors: 0,
      mobilePercentage: 0,
      desktopPercentage: 0,
      tabletPercentage: 0,
      sources: [],
      campaigns: [],
      devices: [],
      systems: [],
      browsers: [],
      recentVisitors: [],
      todayCount: 0,
      weekCount: 0,
    };
  }

  try {
    const { data: rows, error } = await supabase
      .from("analytics_visitors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error || !rows) {
      console.error("[analyticsService] Erreur chargement analytics:", error);
      return {
        error: error?.message || "Erreur de connexion à Supabase",
        totalVisitors: 0,
        totalRawClicks: 0,
        mobilePercentage: 0,
        desktopPercentage: 0,
        tabletPercentage: 0,
        sources: [],
        campaigns: [],
        devices: [],
        systems: [],
        browsers: [],
        recentVisitors: [],
        todayCount: 0,
        weekCount: 0,
      };
    }

    const totalVisitors = rows.length;
    if (totalVisitors === 0) {
      return {
        totalVisitors: 0,
        mobilePercentage: 0,
        desktopPercentage: 0,
        tabletPercentage: 0,
        sources: [],
        campaigns: [],
        devices: [],
        systems: [],
        browsers: [],
        recentVisitors: [],
        todayCount: 0,
        weekCount: 0,
      };
    }

    // Répartition par appareil
    const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
    rows.forEach((r) => {
      const dev = r.device_type || "desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    const mobilePercentage = Math.round(((deviceCounts.mobile || 0) / totalVisitors) * 100);
    const desktopPercentage = Math.round(((deviceCounts.desktop || 0) / totalVisitors) * 100);
    const tabletPercentage = Math.round(((deviceCounts.tablet || 0) / totalVisitors) * 100);

    // Répartition par Source UTM (Facebook, TikTok, etc.)
    const sourceMap = {};
    rows.forEach((r) => {
      const src = r.utm_source || "direct";
      sourceMap[src] = (sourceMap[src] || 0) + 1;
    });
    const sources = Object.entries(sourceMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalVisitors) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Répartition par Campagne UTM (Boosts Facebook / TikTok)
    const campaignMap = {};
    rows.forEach((r) => {
      const camp = r.utm_campaign || "organic";
      if (!campaignMap[camp]) {
        campaignMap[camp] = {
          campaign: camp,
          source: r.utm_source || "direct",
          medium: r.utm_medium || "none",
          count: 0,
          firstSeen: r.first_seen || r.created_at,
          lastSeen: r.last_seen || r.created_at,
        };
      }
      campaignMap[camp].count += 1;
      if (new Date(r.created_at) < new Date(campaignMap[camp].firstSeen)) {
        campaignMap[camp].firstSeen = r.created_at;
      }
      if (new Date(r.last_seen || r.created_at) > new Date(campaignMap[camp].lastSeen)) {
        campaignMap[camp].lastSeen = r.last_seen || r.created_at;
      }
    });

    const campaigns = Object.values(campaignMap)
      .map((c) => ({
        ...c,
        percentage: Math.round((c.count / totalVisitors) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Répartition par OS
    const osMap = {};
    rows.forEach((r) => {
      const os = r.operating_system || "Autre";
      osMap[os] = (osMap[os] || 0) + 1;
    });
    const systems = Object.entries(osMap)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalVisitors) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Visiteurs aujourd'hui et 7 derniers jours
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 24 * 3600 * 1000;

    let todayCount = 0;
    let weekCount = 0;
    let totalRawClicks = 0;
    rows.forEach((r) => {
      totalRawClicks += Number(r.visits_count) || 1;
      const t = new Date(r.created_at).getTime();
      if (t >= startOfToday) todayCount += 1;
      if (t >= sevenDaysAgo) weekCount += 1;
    });

    return {
      totalVisitors,
      totalRawClicks,
      mobilePercentage,
      desktopPercentage,
      tabletPercentage,
      deviceCounts,
      sources,
      campaigns,
      systems,
      recentVisitors: rows.slice(0, 30),
      todayCount,
      weekCount,
    };
  } catch (err) {
    console.error("[analyticsService] Exception chargement analytics:", err);
    return null;
  }
}

import { supabase, requireSupabase, toUserMessage } from "../lib/supabaseClient";

const VISITOR_ID_STORAGE_KEY = "ebp_visitor_id";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateVisitorId() {
  try {
    let visitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (!visitorId || !UUID_REGEX.test(visitorId)) {
      visitorId = generateUUID();
      localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return generateUUID();
  }
}

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

function detectBrowser() {
  if (typeof navigator === "undefined") return "Inconnu";
  const ua = navigator.userAgent;

  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("SamsungBrowser")) return "Samsung Internet";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  return "Autre";
}

export async function trackVisitorVisit() {
  if (typeof window === "undefined" || !supabase) return;
  if (window.location.pathname.startsWith("/admin")) return;

  const urlParams = new URLSearchParams(window.location.search);
  const referrer = document.referrer || "";
  let referrerSource = "direct";
  if (referrer) {
    if (referrer.includes("facebook")) referrerSource = "facebook";
    else if (referrer.includes("tiktok")) referrerSource = "tiktok";
    else if (referrer.includes("instagram")) referrerSource = "instagram";
    else if (referrer.includes("google")) referrerSource = "google";
    else {
      try {
        referrerSource = new URL(referrer).hostname;
      } catch {
        referrerSource = "inconnu";
      }
    }
  }

  const { error } = await supabase.rpc("track_visit", {
    p_visitor_id: getOrCreateVisitorId(),
    p_device_type: detectDeviceType(),
    p_operating_system: detectOperatingSystem(),
    p_browser: detectBrowser(),
    p_utm_source: urlParams.get("utm_source") || referrerSource,
    p_utm_medium: urlParams.get("utm_medium"),
    p_utm_campaign: urlParams.get("utm_campaign"),
    p_utm_term: urlParams.get("utm_term"),
    p_utm_content: urlParams.get("utm_content"),
    p_page_path: window.location.pathname || "/",
    p_referrer: referrer.slice(0, 500) || "direct",
  });
  if (error) throw error;
}

export async function fetchAnalyticsData() {
  const { data: rows, error } = await requireSupabase()
    .from("analytics_visitors")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1000);

  if (error) throw new Error(toUserMessage(error, "Impossible de charger les statistiques d'audience."));

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

  const deviceCounts = { mobile: 0, desktop: 0, tablet: 0 };
  rows.forEach((r) => {
    const dev = r.device_type || "desktop";
    deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
  });

  const mobilePercentage = Math.round(((deviceCounts.mobile || 0) / totalVisitors) * 100);
  const desktopPercentage = Math.round(((deviceCounts.desktop || 0) / totalVisitors) * 100);
  const tabletPercentage = Math.round(((deviceCounts.tablet || 0) / totalVisitors) * 100);

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
}

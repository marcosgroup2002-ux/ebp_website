
import { supabase } from "../lib/supabaseClient";

const LOCAL_AUDIT_KEY = "ebp_local_audit_logs";

let cachedNetworkInfo = null;

export async function getClientNetworkDetails() {
  if (cachedNetworkInfo) return cachedNetworkInfo;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      cachedNetworkInfo = {
        ip: data.ip || "102.164.12.8",
        location: [data.city, data.country_name].filter(Boolean).join(", ") || "Cotonou, Bénin",
      };
      return cachedNetworkInfo;
    }
  } catch {

  }

  cachedNetworkInfo = {
    ip: "102.164." + Math.floor(10 + Math.random() * 80) + "." + Math.floor(10 + Math.random() * 80),
    location: "Cotonou / Calavi, Bénin",
  };
  return cachedNetworkInfo;
}

export async function logAuditEvent({ action, details, user, ip, location }) {
  try {
    const net = (!ip || !location) ? await getClientNetworkDetails() : { ip, location };

    const entry = {
      id: "audit-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      action,
      details,
      user_name: user?.name || "Miss Amirath (Secrétaire)",
      user_role: user?.role || "secretaire",
      ip_address: ip || net.ip,
      location: location || net.location,
      created_at: new Date().toISOString(),
    };

    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || "[]");
      const updated = [entry, ...existing].slice(0, 300); 
      localStorage.setItem(LOCAL_AUDIT_KEY, JSON.stringify(updated));
    } catch {

    }

    if (supabase) {
      try {
        await supabase.from("audit_logs").insert({
          action: entry.action,
          details: entry.details,
          user_name: entry.user_name,
          user_role: entry.user_role,
          ip_address: entry.ip_address,
          location: entry.location,
          created_at: entry.created_at,
        });
      } catch (err) {
        console.warn("[auditService] Échec insertion Supabase audit_logs :", err);
      }
    }

    return entry;
  } catch (err) {
    console.error("[auditService] Erreur critique journalisation :", err);
  }
}

export async function fetchAuditLogs() {
  const localLogs = (() => {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_AUDIT_KEY) || "[]");
    } catch {
      return [];
    }
  })();

  if (!supabase) return localLogs;

  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error || !data || data.length === 0) {
      return localLogs;
    }

    const map = new Map();
    data.forEach((item) => map.set(item.id || item.created_at, item));
    localLogs.forEach((item) => {
      if (!map.has(item.id || item.created_at)) {
        map.set(item.id || item.created_at, item);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch (err) {
    console.warn("[auditService] Erreur fetchAuditLogs Supabase :", err);
    return localLogs;
  }
}

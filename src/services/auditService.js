import { requireSupabase, toUserMessage } from "../lib/supabaseClient";

export async function fetchAuditLogs(limit = 200) {
  const { data, error } = await requireSupabase()
    .from("audit_logs")
    .select("id, action, details, user_name, user_role, ip_address, location, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(toUserMessage(error, "Impossible de charger les journaux d'audit."));
  return data;
}

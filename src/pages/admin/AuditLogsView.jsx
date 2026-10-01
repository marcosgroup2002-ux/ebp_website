import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw, Download, MapPin, Globe } from "lucide-react";
import { fetchAuditLogs } from "../../services/auditService";
import { downloadTextFile } from "../../services/paymentsService";

export default function AuditLogsView() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchAuditLogs();
    setLogs(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const actionTypes = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.action)));
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchQuery =
        (log.details && log.details.toLowerCase().includes(query.toLowerCase())) ||
        (log.user_name && log.user_name.toLowerCase().includes(query.toLowerCase())) ||
        (log.ip_address && log.ip_address.includes(query)) ||
        (log.location && log.location.toLowerCase().includes(query.toLowerCase()));
      const matchAction = actionFilter === "all" || log.action === actionFilter;
      return matchQuery && matchAction;
    });
  }, [logs, query, actionFilter]);

  const exportCSV = () => {
    const headers = ["Date & Heure", "Acteur", "Rôle", "Action", "Détails", "Adresse IP", "Lieu"];
    const rows = filteredLogs.map((l) => [
      new Date(l.created_at).toLocaleString("fr-FR"),
      l.user_name,
      l.user_role,
      l.action,
      l.details,
      l.ip_address || "",
      l.location || "",
    ]);
    const escape = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
    downloadTextFile(`ebp-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`, csv);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-ink">Journaux d'Audit & Sécurité</h1>
            <span className="rounded-full bg-ebp-blue/10 px-3 py-0.5 text-xs font-bold text-ebp-blue">
              Direction & Contrôle
            </span>
          </div>
          <p className="mt-1 text-sm text-ink/50">
            Traçabilité intégrale en arrière-plan : connexions, modifications de dossiers, encaissements et suppressions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink/10 bg-white px-3.5 py-2 text-xs font-semibold text-ink/70 hover:bg-surface transition-colors shadow-sm"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-ebp-blue" : ""} />
            Actualiser
          </button>
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-ebp-blue px-4 py-2 text-xs font-semibold text-white hover:bg-ebp-blue-dark transition-colors shadow-sm"
          >
            <Download size={13} />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par acteur, détail, adresse IP ou lieu..."
            className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-ink/10 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
        >
          <option value="all">Toutes les actions ({logs.length})</option>
          {actionTypes.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      {/* Tableau complet */}
      <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead>
            <tr className="border-b border-ink/10 bg-surface/50 text-ink/40 uppercase tracking-wider">
              <th className="py-3 px-4">Date & Heure</th>
              <th className="py-3 px-4">Acteur</th>
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Détails de l'événement</th>
              <th className="py-3 px-4">Origine (IP & Localisation)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/5">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-ink/40">
                  <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-ebp-blue border-t-transparent" />
                  <p className="mt-2 text-xs">Chargement du journal d'audit...</p>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-ink/40">
                  Aucun enregistrement ne correspond aux critères.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-surface/60 transition-colors">
                  <td className="py-3.5 px-4 text-ink/60 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-semibold text-ink">{log.user_name}</span>
                    <span className="ml-1 text-[10px] text-ink/40 uppercase">({log.user_role})</span>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="rounded-md bg-ebp-blue/10 px-2 py-0.5 font-mono text-[11px] font-bold text-ebp-blue">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-ink/80 max-w-md leading-relaxed">{log.details}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-mono text-ink/70">
                      <Globe size={12} className="text-ink/30 shrink-0" />
                      <span>{log.ip_address || "—"}</span>
                    </div>
                    {log.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-ink/45 mt-0.5">
                        <MapPin size={11} className="text-ebp-red shrink-0" />
                        <span>{log.location}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Search,
  Download,
  ShieldAlert,
  CheckCircle,
  MousePointerClick,
  Users,
} from "lucide-react";
import { fetchAnalyticsData } from "../../services/analyticsService";
import { useAdminUser } from "../../context/AdminUserContext";

export default function AnalyticsView() {
  const { user } = useAdminUser();

  // 1. RESTRICTION STRICTE DE SÉCURITÉ : RÉSERVÉ AU PDG UNIQUEMENT
  const isPdg = user?.role === "pdg";

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const loadAnalytics = async () => {
    setLoading(true);
    const res = await fetchAnalyticsData();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    if (isPdg) {
      loadAnalytics();
      const interval = setInterval(loadAnalytics, 60000);
      return () => clearInterval(interval);
    }
  }, [isPdg]);

  // Si l'utilisateur n'est pas le PDG, blocage strict
  if (!isPdg) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-ebp-red-soft mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold font-display text-ink">Accès Confidentiel Restreint</h2>
        <p className="mt-2 max-w-md text-sm text-ink/60">
          Cette section d'analyse d'audience et de mesure des campagnes est strictement réservée à la Direction Générale (PDG).
        </p>
        <Link
          to="/admin/paiements"
          className="mt-6 rounded-xl bg-ebp-blue px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-ebp-blue-light transition-all"
        >
          Retour aux Apprenants
        </Link>
      </div>
    );
  }

  // Filtrage des campagnes
  const filteredCampaigns = useMemo(() => {
    if (!data?.campaigns) return [];
    if (!searchTerm.trim()) return data.campaigns;
    const term = searchTerm.toLowerCase();
    return data.campaigns.filter(
      (c) =>
        c.campaign.toLowerCase().includes(term) ||
        c.source.toLowerCase().includes(term) ||
        c.medium.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  // Export CSV
  const exportCsv = () => {
    if (!data?.recentVisitors || data.recentVisitors.length === 0) return;
    const headers = ["Visitor_ID", "Appareil", "OS", "Navigateur", "Source_UTM", "Campagne_UTM", "Page", "Date"];
    const rows = data.recentVisitors.map((v) => [
      v.visitor_id,
      v.device_type,
      v.operating_system,
      v.browser,
      v.utm_source,
      v.utm_campaign,
      v.page_path,
      new Date(v.created_at).toLocaleString("fr-FR"),
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ebp-audience-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceBadge = (source) => {
    const s = (source || "").toLowerCase();
    if (s.includes("facebook")) return "bg-blue-50 text-blue-700 border-blue-200";
    if (s.includes("tiktok")) return "bg-slate-900 text-white border-slate-700";
    if (s.includes("instagram")) return "bg-pink-50 text-pink-700 border-pink-200";
    if (s.includes("google")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6 w-full">
      {/* En-tête de section */}
      <div className="flex flex-col gap-4 rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-ink/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ebp-blue text-white shadow-xs">
                <TrendingUp size={20} />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold font-display text-ink">
                  Audience & Métriques des Visiteurs
                </h1>
                <p className="text-xs text-ink/60">
                  Supervision confidentielle · Règle Machine Unique (1 appareil = 1 compte)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-semibold text-ink transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl bg-ebp-blue hover:bg-ebp-blue-light px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition-all active:scale-95"
            >
              <Download size={14} />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* LES 3 MÉTRIQUES CLÉS DEMANDÉES */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 1. Appareils / Visiteurs Uniques */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-ink/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Visiteurs Uniques Réels
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-ebp-blue">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink font-display">
            {loading ? "..." : (data?.totalVisitors || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle size={13} />
            <span>1 appareil = 1 compte unique strict</span>
          </div>
        </div>

        {/* 2. Total des Clics Bruts sur le site */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-ink/10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Total Clics Bruts
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MousePointerClick size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink font-display">
            {loading ? "..." : (data?.totalRawClicks || data?.totalVisitors || 0).toLocaleString()}
          </p>
          <div className="mt-2 text-xs text-ink/60">
            Cumul de toutes les interactions enregistrées
          </div>
        </div>

        {/* 3. Répartition Dominante */}
        <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-ink/10 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Taux Mobile Principal
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl sm:text-4xl font-extrabold text-ink font-display">
            {loading ? "..." : `${data?.mobilePercentage || 0}%`}
          </p>
          <div className="mt-2 text-xs text-ink/60">
            {data?.deviceCounts?.mobile || 0} smartphones sur {data?.totalVisitors || 0} appareils
          </div>
        </div>
      </div>

      {/* DÉTAIL DE LA RÉPARTITION PAR APPAREILS */}
      <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-xs border border-ink/10">
        <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
          Répartition par Type d'Appareil
        </h2>
        <p className="mt-1 text-xs text-ink/60">
          Volume et proportion exacte selon le type d'équipement
        </p>

        {/* Barre de progression proportionnelle */}
        <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            style={{ width: `${data?.mobilePercentage || 0}%` }}
            className="bg-cyan-500 transition-all duration-500"
            title={`Mobile: ${data?.mobilePercentage || 0}%`}
          />
          <div
            style={{ width: `${data?.desktopPercentage || 0}%` }}
            className="bg-ebp-blue transition-all duration-500"
            title={`Ordinateur: ${data?.desktopPercentage || 0}%`}
          />
          <div
            style={{ width: `${data?.tabletPercentage || 0}%` }}
            className="bg-purple-500 transition-all duration-500"
            title={`Tablette: ${data?.tabletPercentage || 0}%`}
          />
        </div>

        {/* 3 Cartes fluides */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-ink/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
              <Smartphone size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink">Smartphones</span>
              <span className="text-xs text-ink/60">
                {data?.mobilePercentage || 0}% ({data?.deviceCounts?.mobile || 0})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-ink/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-ebp-blue">
              <Monitor size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink">Ordinateurs</span>
              <span className="text-xs text-ink/60">
                {data?.desktopPercentage || 0}% ({data?.deviceCounts?.desktop || 0})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3.5 border border-ink/5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Tablet size={18} />
            </div>
            <div>
              <span className="block text-xs font-bold text-ink">Tablettes</span>
              <span className="text-xs text-ink/60">
                {data?.tabletPercentage || 0}% ({data?.deviceCounts?.tablet || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TABLEAU DES CAMPAGNES & BOOSTS (ÉPURÉ) */}
      <div className="rounded-2xl bg-white shadow-xs border border-ink/10 overflow-hidden">
        <div className="flex flex-col gap-3 p-5 sm:p-6 sm:flex-row sm:items-center sm:justify-between border-b border-ink/10">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-ink font-display">
              Canaux d'Acquisition & Campagnes
            </h2>
            <p className="mt-0.5 text-xs text-ink/60">
              Nombre de machines uniques captées par chaque source ou campagne
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Filtrer une source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-ink/15 bg-surface py-2 pl-9 pr-3 text-xs text-ink placeholder:text-ink/40 focus:border-ebp-blue focus:outline-hidden"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-ink/10 text-ink/60 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Campagne / Canal</th>
                <th className="px-5 py-3.5">Source</th>
                <th className="px-5 py-3.5 text-right">Machines Uniques</th>
                <th className="px-5 py-3.5 text-right">Part Audience</th>
                <th className="px-5 py-3.5 text-right">Dernière Visite</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-ink/40">
                    Aucune campagne enregistrée pour l'instant. Les données apparaîtront dès les premières visites.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => (
                  <tr key={`${c.campaign}-${c.source}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-ink">
                      <span className="font-mono text-xs text-ebp-blue">{c.campaign}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${getSourceBadge(c.source)}`}>
                        {c.source}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-ink font-mono text-sm">
                      {c.count}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-bold text-ink text-[11px]">
                        {c.percentage}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right text-ink/50 text-[11px]">
                      {new Date(c.lastSeen).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

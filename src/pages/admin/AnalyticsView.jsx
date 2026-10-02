import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  RefreshCw,
  Search,
  ExternalLink,
  Layers,
  Calendar,
  Users,
  CheckCircle,
  Copy,
  Check,
  Download,
  Flame,
  Globe,
} from "lucide-react";
import { fetchAnalyticsData } from "../../services/analyticsService";
import { supabase } from "../../lib/supabaseClient";

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all"); // 'all' | 'week' | 'today'
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Générateur d'URL avec UTM pour les Boosts Facebook / TikTok
  const [generatorSource, setGeneratorSource] = useState("facebook");
  const [generatorCampaign, setGeneratorCampaign] = useState("boost_octobre");
  const [generatorMedium, setGeneratorMedium] = useState("cpc");

  const loadAnalytics = async () => {
    setLoading(true);
    const res = await fetchAnalyticsData();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadAnalytics();
    // Rafraîchissement automatique toutes les 60 secondes
    const interval = setInterval(loadAnalytics, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtrage des campagnes selon la recherche
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

  // Calcul du trafic sponsorisé vs direct
  const sponsoredVisitorsCount = useMemo(() => {
    if (!data?.sources) return 0;
    return data.sources
      .filter((s) => ["facebook", "tiktok", "instagram", "google", "meta"].includes(s.name.toLowerCase()))
      .reduce((acc, s) => acc + s.count, 0);
  }, [data]);

  // URL générée pour les campagnes marketing
  const generatedCampaignUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ebp-benin.com";
    return `${origin}/?utm_source=${encodeURIComponent(generatorSource)}&utm_medium=${encodeURIComponent(generatorMedium)}&utm_campaign=${encodeURIComponent(generatorCampaign)}`;
  }, [generatorSource, generatorMedium, generatorCampaign]);

  const copyCampaignUrl = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(generatedCampaignUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

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
    link.setAttribute("download", `ebp-analytics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Badge couleur pour les sources marketing
  const getSourceBadge = (source) => {
    const s = (source || "").toLowerCase();
    if (s.includes("facebook")) return "bg-blue-900/60 text-blue-300 border-blue-700/50";
    if (s.includes("tiktok")) return "bg-rose-900/60 text-rose-300 border-rose-700/50";
    if (s.includes("instagram")) return "bg-pink-900/60 text-pink-300 border-pink-700/50";
    if (s.includes("google")) return "bg-emerald-900/60 text-emerald-300 border-emerald-700/50";
    return "bg-slate-800 text-slate-300 border-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* En-tête sombre & moderne */}
      <div className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md">
                <TrendingUp size={20} className="text-white" />
              </div>
              <h1 className="text-xl font-bold font-display tracking-tight sm:text-2xl text-white">
                Analytics Marketing & Suivi des Boosts
              </h1>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-slate-300">
              Comptage certifié : <span className="font-semibold text-cyan-400">1 Appareil = 1 Compte Unique</span> (0 FCFA · Zéro coût tiers)
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={loadAnalytics}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all border border-slate-700 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </button>
            <button
              onClick={exportCsv}
              className="flex items-center gap-2 rounded-xl bg-cyan-600/90 hover:bg-cyan-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all active:scale-95"
            >
              <Download size={14} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Barre d'état Supabase */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/80 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
            <span>Moteur Supabase actif · Table <code className="text-cyan-300">analytics_visitors</code></span>
          </div>
          <div className="text-slate-400">
            Dernière synchronisation : {new Date().toLocaleTimeString("fr-FR")}
          </div>
        </div>
      </div>

      {/* Cartes KPI Clés */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Visiteurs Uniques */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-ink/10 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Visiteurs Uniques Réels
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-ebp-blue">
              <Users size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {loading ? "..." : (data?.totalVisitors || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
            <CheckCircle size={13} />
            <span>1 Machine = 1 Seul Compte</span>
          </div>
        </div>

        {/* 2. Trafic Mobile */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-ink/10 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Part Mobile
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <Smartphone size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {loading ? "..." : `${data?.mobilePercentage || 0}%`}
          </p>
          <div className="mt-2 text-xs text-ink/60">
            {data?.deviceCounts?.mobile || 0} smartphones détectés
          </div>
        </div>

        {/* 3. Trafic Boosts Sponsorisés */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-ink/10 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              Trafic Boosts Réseaux
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Flame size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {loading ? "..." : sponsoredVisitorsCount}
          </p>
          <div className="mt-2 text-xs text-ink/60">
            Facebook, TikTok, Instagram & Ads
          </div>
        </div>

        {/* 4. Actifs Récents (7j) */}
        <div className="rounded-2xl bg-white p-5 shadow-xs border border-ink/10 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
              7 Derniers Jours
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Calendar size={16} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-ink">
            {loading ? "..." : (data?.weekCount || 0)}
          </p>
          <div className="mt-2 text-xs text-ink/60">
            Aujourd'hui : <span className="font-bold text-ink">{data?.todayCount || 0}</span>
          </div>
        </div>
      </div>

      {/* Répartition Appareils & Systèmes */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Barre de répartition des appareils */}
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-ink/10 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
            Répartition par Type d'Appareil
          </h2>
          <p className="mt-1 text-xs text-ink/60">
            Classification physique entre smartphones, ordinateurs et tablettes
          </p>

          <div className="mt-5 space-y-4">
            {/* Barre visuelle globale */}
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                style={{ width: `${data?.mobilePercentage || 0}%` }}
                className="bg-cyan-500 transition-all duration-500"
                title={`Mobile: ${data?.mobilePercentage}%`}
              />
              <div
                style={{ width: `${data?.desktopPercentage || 0}%` }}
                className="bg-blue-600 transition-all duration-500"
                title={`Desktop: ${data?.desktopPercentage}%`}
              />
              <div
                style={{ width: `${data?.tabletPercentage || 0}%` }}
                className="bg-purple-500 transition-all duration-500"
                title={`Tablette: ${data?.tabletPercentage}%`}
              />
            </div>

            {/* Légende détaillée */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-ink/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700">
                  <Smartphone size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink">Mobile</span>
                  <span className="text-xs text-ink/60">
                    {data?.mobilePercentage || 0}% ({data?.deviceCounts?.mobile || 0})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-ink/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                  <Monitor size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink">Desktop</span>
                  <span className="text-xs text-ink/60">
                    {data?.desktopPercentage || 0}% ({data?.deviceCounts?.desktop || 0})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 border border-ink/5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Tablet size={16} />
                </div>
                <div>
                  <span className="block text-xs font-bold text-ink">Tablette</span>
                  <span className="text-xs text-ink/60">
                    {data?.tabletPercentage || 0}% ({data?.deviceCounts?.tablet || 0})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Systèmes d'exploitation détectés */}
        <div className="rounded-2xl bg-white p-6 shadow-xs border border-ink/10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
            Systèmes d'Exploitation
          </h2>
          <p className="mt-1 text-xs text-ink/60">Environnements clients réels</p>

          <div className="mt-4 space-y-2.5">
            {(!data?.systems || data.systems.length === 0) && (
              <p className="text-xs text-ink/40 py-4 text-center">Aucune donnée disponible</p>
            )}
            {data?.systems?.slice(0, 5).map((os) => (
              <div key={os.name} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-ink">{os.name}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                    <div
                      style={{ width: `${os.percentage}%` }}
                      className="h-full bg-ebp-blue rounded-full"
                    />
                  </div>
                  <span className="w-9 text-right font-mono text-ink/60 font-medium">
                    {os.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLEAU DES CAMPAGNES ET SOURCES UTM (Cœur du besoin) */}
      <div className="rounded-2xl bg-white shadow-xs border border-ink/10 overflow-hidden">
        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between border-b border-ink/10">
          <div>
            <h2 className="text-base font-bold text-ink font-display">
              Campagnes & Sources de Trafic (Boosts Marketing)
            </h2>
            <p className="mt-0.5 text-xs text-ink/60">
              Mesure exacte de l'impact de chaque boost Facebook, TikTok et campagne sponsorisée
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              type="text"
              placeholder="Rechercher un boost..."
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
                <th className="px-6 py-3.5">Campagne (utm_campaign)</th>
                <th className="px-6 py-3.5">Source (utm_source)</th>
                <th className="px-6 py-3.5">Support (utm_medium)</th>
                <th className="px-6 py-3.5 text-right">Machines Uniques</th>
                <th className="px-6 py-3.5 text-right">Part Audience</th>
                <th className="px-6 py-3.5 text-right">Dernière Entrée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-ink/40">
                    Aucune campagne enregistrée pour le moment. Lancez un premier boost avec les liens ci-dessous !
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => (
                  <tr key={`${c.campaign}-${c.source}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-ink flex items-center gap-2">
                      <span className="font-mono text-xs text-ebp-blue font-bold">{c.campaign}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold border ${getSourceBadge(c.source)}`}>
                        {c.source}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-ink/60 font-mono text-[11px]">{c.medium}</td>
                    <td className="px-6 py-4 text-right font-extrabold text-ink font-mono text-sm">
                      {c.count}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-bold text-ink text-[11px]">
                        {c.percentage}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-ink/50 text-[11px]">
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

      {/* GÉNÉRATEUR D'URL AVEC PARAMÈTRES UTM POUR VOS BOOSTS */}
      <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 text-white border border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <Share2 size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Générateur d'URL pour vos Boosts Facebook & TikTok
            </h3>
            <p className="text-xs text-slate-300">
              Collez ce lien personnalisé dans votre gestionnaire de publicités Meta ou TikTok pour suivre les résultats ici en direct
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Plateforme (utm_source)
            </label>
            <select
              value={generatorSource}
              onChange={(e) => setGeneratorSource(e.target.value)}
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            >
              <option value="facebook">Facebook (Boost Meta)</option>
              <option value="tiktok">TikTok (Boost / Ads)</option>
              <option value="instagram">Instagram (Story / Reel)</option>
              <option value="whatsapp">WhatsApp Status</option>
              <option value="linkedin">LinkedIn Ads</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Nom de la Campagne (utm_campaign)
            </label>
            <input
              type="text"
              value={generatorCampaign}
              onChange={(e) => setGeneratorCampaign(e.target.value)}
              placeholder="ex: boost_octobre_calavi"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Format Publicitaire (utm_medium)
            </label>
            <input
              type="text"
              value={generatorMedium}
              onChange={(e) => setGeneratorMedium(e.target.value)}
              placeholder="ex: cpc, story, feed, boost"
              className="w-full rounded-xl bg-slate-800 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-hidden focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Aperçu du lien généré et bouton de copie */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            readOnly
            value={generatedCampaignUrl}
            className="flex-1 rounded-xl bg-slate-950 border border-slate-700 px-3.5 py-2.5 font-mono text-xs text-cyan-300 focus:outline-hidden select-all"
          />
          <button
            onClick={copyCampaignUrl}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-5 py-2.5 text-xs font-bold text-white shadow-md active:scale-95 transition-all shrink-0"
          >
            {copiedUrl ? <Check size={15} /> : <Copy size={15} />}
            {copiedUrl ? "Copié !" : "Copier le Lien"}
          </button>
        </div>
      </div>
    </div>
  );
}

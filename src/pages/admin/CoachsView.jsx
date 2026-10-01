import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, MapPin, Users, BookOpen, AlertCircle, Bell, Shield, Filter } from "lucide-react";
import { ACTIVE_CENTERS, ACTIVE_COHORTS } from "../../data/adminData";
import { fetchCoachSchedules, fetchAnnouncements } from "../../services/coachService";

export default function CoachsView() {
  const [schedules, setSchedules] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [centerFilter, setCenterFilter] = useState("all");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");

  useEffect(() => {
    let isMounted = true;
    Promise.all([fetchCoachSchedules(), fetchAnnouncements()]).then(([sch, ann]) => {
      if (isMounted) {
        setSchedules(sch || []);
        setAnnouncements(ann || []);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const coachNames = useMemo(() => {
    return Array.from(new Set(schedules.map((s) => s.coach_name)));
  }, [schedules]);

  const filteredSchedules = useMemo(() => {
    return schedules.filter((s) => {
      const matchCenter = centerFilter === "all" || s.centre === centerFilter;
      const matchCohort = cohortFilter === "all" || s.cohorte === cohortFilter;
      const matchCoach = coachFilter === "all" || s.coach_name === coachFilter;
      return matchCenter && matchCohort && matchCoach;
    });
  }, [schedules, centerFilter, cohortFilter, coachFilter]);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Espace Pédagogique Coachs</h1>
          <p className="mt-1 text-sm text-ink/50">
            Portail unifié pour les 6 coachs d'EBP (4 à Calavi, 2 à Cotonou) · Emploi du temps & consignes de la direction.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-semibold text-ebp-blue">
          <Shield size={16} />
          Accès pédagogique sécurisé (Lecture seule)
        </div>
      </div>

      {/* FIL D'ACTUALITÉ / ANNONCES DU PDG */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-ink/10 pb-4">
          <Bell size={18} className="text-ebp-blue" />
          <h2 className="font-display text-base font-bold text-ink">Consignes & Communiqués de la Direction (PDG)</h2>
        </div>

        <div className="mt-4 space-y-3">
          {announcements.length === 0 ? (
            <p className="text-sm text-ink/40">Aucun communiqué officiel pour le moment.</p>
          ) : (
            announcements.map((a) => (
              <div
                key={a.id}
                className={`rounded-xl border p-4.5 transition-all ${
                  a.priorite === "urgente"
                    ? "border-red-200 bg-red-50/70"
                    : "border-ink/10 bg-surface/60"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      a.priorite === "urgente"
                        ? "bg-red-200 text-ebp-red-soft"
                        : "bg-ebp-blue/10 text-ebp-blue"
                    }`}
                  >
                    <AlertCircle size={12} />
                    {a.priorite === "urgente" ? "Consigne Urgente" : "Communiqué Officiel"}
                  </span>
                  <span className="text-xs text-ink/40">
                    {new Date(a.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-ink">{a.titre}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/70">{a.contenu}</p>
                <p className="mt-3 text-xs font-semibold text-ink/50">Émis par : {a.auteur}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* EMPLOI DU TEMPS UNIFIÉ DES COACHS */}
      <div className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-ink/10 pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-ebp-green" />
            <div>
              <h2 className="font-display text-base font-bold text-ink">Emploi du Temps Hebdomadaire</h2>
              <p className="text-xs text-ink/40">Planning des séances pour les cohortes 18.6, 18.7 et 18.8</p>
            </div>
          </div>

          {/* Filtres interactifs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-ink/40 mr-1">
              <Filter size={13} />
              Filtrer :
            </div>

            {/* Filtre Centre */}
            <select
              value={centerFilter}
              onChange={(e) => setCenterFilter(e.target.value)}
              className="rounded-xl border border-ink/10 bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ebp-blue"
            >
              <option value="all">Tous les centres (Calavi & Cotonou)</option>
              {ACTIVE_CENTERS.map((c) => (
                <option key={c} value={c}>
                  Centre {c}
                </option>
              ))}
            </select>

            {/* Filtre Cohorte */}
            <select
              value={cohortFilter}
              onChange={(e) => setCohortFilter(e.target.value)}
              className="rounded-xl border border-ink/10 bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ebp-blue"
            >
              <option value="all">Toutes les cohortes</option>
              {ACTIVE_COHORTS.map((co) => (
                <option key={co} value={co}>
                  Cohorte {co}
                </option>
              ))}
            </select>

            {/* Filtre Coach */}
            <select
              value={coachFilter}
              onChange={(e) => setCoachFilter(e.target.value)}
              className="rounded-xl border border-ink/10 bg-surface px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-ebp-blue"
            >
              <option value="all">Tous les coachs (6 au total)</option>
              {coachNames.map((cn) => (
                <option key={cn} value={cn}>
                  {cn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grille des séances */}
        {loading ? (
          <div className="py-12 text-center text-sm text-ink/40">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-ebp-green border-t-transparent" />
            <p className="mt-2 text-xs">Chargement du planning pédagogique...</p>
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="py-12 text-center text-sm text-ink/40">
            Aucune séance ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSchedules.map((sch) => (
              <div
                key={sch.id}
                className="flex flex-col justify-between rounded-xl border border-ink/10 bg-surface/50 p-4 transition-all hover:border-ebp-blue hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-ebp-blue/10 px-2 py-0.5 text-xs font-bold text-ebp-blue">
                      Cohorte {sch.cohorte}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-medium text-ink/60">
                      <MapPin size={12} className="text-ebp-red" />
                      {sch.centre}
                    </span>
                  </div>

                  <h4 className="mt-3 font-display text-sm font-bold text-ink">{sch.matiere}</h4>

                  <div className="mt-3 space-y-1.5 text-xs text-ink/60">
                    <div className="flex items-center gap-2">
                      <Users size={13} className="text-ink/40 shrink-0" />
                      <span className="font-semibold text-ink/80">{sch.coach_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-ink/40 shrink-0" />
                      <span>
                        {sch.jour} · {sch.heure_debut} - {sch.heure_fin}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-ink/40 shrink-0" />
                      <span>{sch.salle}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-ink/5 pt-2 text-[11px] text-ink/40">
                  Émargement et présence obligatoires
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

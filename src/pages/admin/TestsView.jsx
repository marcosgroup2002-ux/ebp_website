import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ClipboardList,
  Search,
  RefreshCw,
  Plus,
  ChevronRight,
  Send,
  PhoneCall,
  Save,
  Trash2,
  Info,
  MessageCircle,
  Mail,
  Inbox,
  FileText,
} from "lucide-react";
import { useAdminUser } from "../../context/AdminUserContext";
import Modal from "../../components/admin/Modal";
import {
  ALL_LEVELS,
  LEVELS,
  LEVEL_INFO,
  STATUS_INFO,
  addTestResult,
  contactLink,
  deleteTestResult,
  fetchTestResults,
  finalLevel,
  reviewTestResult,
  scorePercent,
  setTestStatus,
} from "../../services/testsService";

const FILTERS = [
  { id: "all", label: "Tous" },
  { id: "nouveau", label: "Nouveaux" },
  { id: "contacte", label: "Contactés" },
  { id: "transmis", label: "Transmis" },
];

const formatDate = (iso) =>
  new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function LevelBadge({ level, large = false }) {
  if (!level) return <span className="text-xs text-ink/35">—</span>;
  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg bg-ebp-blue font-display font-bold text-white ${
        large ? "min-w-[3rem] px-3 py-1.5 text-lg" : "min-w-[2.25rem] px-2 py-1 text-xs"
      }`}
    >
      {level}
    </span>
  );
}

function StatusBadge({ status }) {
  const info = STATUS_INFO[status] || STATUS_INFO.nouveau;
  return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${info.classes}`}>{info.label}</span>;
}

function LevelBars({ detail }) {
  const rows = LEVELS.filter((level) => detail?.[level]);
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      {rows.map((level) => {
        const [ok, total] = detail[level];
        const pct = Math.round((ok / total) * 100);
        return (
          <div key={level} className="flex items-center gap-3 text-xs">
            <span className="w-7 font-display font-bold text-ink">{level}</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink/10">
              <div className="h-full rounded-full bg-ebp-blue" style={{ width: `${pct}%` }} />
            </div>
            <span className="w-14 text-right tabular-nums text-ink/60">
              {ok}/{total}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DetailModal({ result, canEdit, onClose, onChanged }) {
  const [level, setLevel] = useState(result.niveau_valide || result.niveau_estime || "");
  const [note, setNote] = useState(result.note || "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const locked = result.statut === "transmis";
  const contact = contactLink(result.contact);
  const pct = scorePercent(result);

  const run = async (label, action) => {
    if (busy) return;
    setBusy(label);
    setError("");
    try {
      await action();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const save = () => run("save", () => reviewTestResult(result.id, level, note));
  const markContacted = () => run("contact", () => setTestStatus(result.id, "contacte"));
  const transmit = () => {
    if (!window.confirm(`Transmettre le résultat de ${result.nom} au PDG ?\n\nIl ne pourra plus être modifié.`)) return;
    run("transmit", async () => {
      await reviewTestResult(result.id, level, note);
      await setTestStatus(result.id, "transmis");
    });
  };
  const remove = () => {
    if (!window.confirm(`Supprimer définitivement le résultat de ${result.nom} ?`)) return;
    run("delete", async () => {
      await deleteTestResult(result.id);
      onClose();
    });
  };

  return (
    <Modal open onClose={onClose} title={`Test de niveau · ${result.nom}`} maxWidth="max-w-2xl">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
          <StatusBadge status={result.statut} />
          <span>{formatDate(result.passe_le)}</span>
          <span aria-hidden="true">·</span>
          <span>{result.source === "google_form" ? "Reçu du Google Form" : "Saisi à la main"}</span>
        </div>

        {result.contact ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-surface p-4">
            <div className="min-w-0">
              <p className="text-xs text-ink/45">Contact</p>
              <p className="break-all font-semibold text-ink">{result.contact}</p>
            </div>
            {contact && (
              <a
                href={contact.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ebp-blue px-4 py-2 text-xs font-semibold text-white hover:bg-ebp-blue-dark"
              >
                {contact.href.startsWith("mailto") ? <Mail size={14} /> : <MessageCircle size={14} />}
                {contact.label}
              </a>
            )}
          </div>
        ) : (
          <p className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-900">
            Aucun contact enregistré pour ce candidat. Ajoutez une question « WhatsApp / email » dans le Google Form pour pouvoir le rappeler.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-[auto,1fr] sm:items-center">
          <div className="rounded-2xl border border-ink/10 p-4 text-center sm:min-w-[9rem]">
            <p className="text-xs text-ink/45">Score automatique</p>
            <p className="mt-1 font-display text-3xl font-bold text-ink">
              {result.score ?? "—"}
              {result.score_max ? <span className="text-lg font-semibold text-ink/40"> / {result.score_max}</span> : null}
            </p>
            {pct !== null && <p className="text-xs font-semibold text-ebp-blue">{pct} %</p>}
          </div>
          <div>
            <LevelBars detail={result.detail_niveaux} />
            {!result.detail_niveaux && <p className="text-xs text-ink/45">Pas de détail par niveau pour ce résultat.</p>}
          </div>
        </div>

        {result.redaction && (
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
              <FileText size={14} />
              Rédaction à corriger (10 points)
            </p>
            <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-ink/10 bg-white p-4 text-sm leading-relaxed text-ink/80">
              {result.redaction}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-ink/10 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">Niveau retenu</p>
              <p className="mt-0.5 text-xs text-ink/45">
                {result.niveau_estime ? `Estimation automatique : ${result.niveau_estime} (${LEVEL_INFO[result.niveau_estime]})` : "Pas d'estimation automatique"}
              </p>
            </div>
            {!canEdit || locked ? (
              <div className="flex items-center gap-2">
                <LevelBadge level={finalLevel(result)} large />
                <span className="text-xs text-ink/50">{LEVEL_INFO[finalLevel(result)]}</span>
              </div>
            ) : (
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                aria-label="Niveau retenu"
                className="rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ebp-blue"
              >
                <option value="">Non défini</option>
                {ALL_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l} · {LEVEL_INFO[l]}
                  </option>
                ))}
              </select>
            )}
          </div>

          <label htmlFor="test-note" className="mt-4 block text-xs font-semibold uppercase tracking-wide text-ink/50">
            {canEdit ? "Note pour le PDG" : "Note du secrétariat"}
          </label>
          {!canEdit || locked ? (
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink/75">{result.note || "Aucune note."}</p>
          ) : (
            <textarea
              id="test-note"
              rows={3}
              maxLength={1000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Rédaction corrigée, points forts, formule conseillée…"
              className="mt-1.5 w-full rounded-xl border border-ink/10 bg-surface px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
            />
          )}
        </div>

        {locked && (
          <p className="flex items-start gap-2 rounded-2xl bg-ebp-green/10 p-4 text-xs text-ink/70">
            <Send size={14} className="mt-0.5 shrink-0 text-ebp-green" />
            Transmis au PDG{result.transmis_par ? ` par ${result.transmis_par}` : ""} le {formatDate(result.transmis_at)}.
          </p>
        )}

        {error && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-ebp-red-soft">
            {error}
          </p>
        )}

        {canEdit && !locked && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={transmit}
              disabled={Boolean(busy)}
              className="btn-primary disabled:opacity-60"
            >
              <Send size={15} />
              {busy === "transmit" ? "Transmission..." : "Transmettre au PDG"}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={Boolean(busy)}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ebp-blue hover:text-ebp-blue disabled:opacity-60"
            >
              <Save size={15} />
              {busy === "save" ? "Enregistrement..." : "Enregistrer"}
            </button>
            {result.statut === "nouveau" && (
              <button
                type="button"
                onClick={markContacted}
                disabled={Boolean(busy)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold text-ink transition hover:border-ebp-blue hover:text-ebp-blue disabled:opacity-60"
              >
                <PhoneCall size={15} />
                Marquer comme contacté
              </button>
            )}
            <button
              type="button"
              onClick={remove}
              disabled={Boolean(busy)}
              className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-semibold text-ebp-red-soft transition hover:bg-red-50 disabled:opacity-60 sm:ml-auto"
            >
              <Trash2 size={14} />
              Supprimer
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function AddModal({ open, onClose, onAdded }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { nom: "", contact: "", score: "", scoreMax: "", niveau: "", note: "" } });
  const [error, setError] = useState("");

  const close = () => {
    setError("");
    reset();
    onClose();
  };

  const submit = async (data) => {
    setError("");
    try {
      await addTestResult({
        nom: data.nom.trim(),
        contact: data.contact.trim(),
        score: data.score === "" ? null : Number(data.score),
        scoreMax: data.scoreMax === "" ? null : Number(data.scoreMax),
        niveau: data.niveau,
        note: data.note.trim(),
      });
      await onAdded();
      close();
    } catch (err) {
      setError(err.message);
    }
  };

  const field =
    "mt-1.5 w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue";

  return (
    <Modal open={open} onClose={close} title="Ajouter un résultat de test">
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label htmlFor="add-nom" className="text-xs font-medium text-ink/60">Nom complet</label>
          <input id="add-nom" className={field} {...register("nom", { required: "Le nom est obligatoire.", minLength: { value: 2, message: "Au moins 2 caractères." }, maxLength: { value: 120, message: "Nom trop long." } })} />
          {errors.nom && <p className="mt-1 text-xs text-ebp-red-soft">{errors.nom.message}</p>}
        </div>
        <div>
          <label htmlFor="add-contact" className="text-xs font-medium text-ink/60">WhatsApp ou email</label>
          <input id="add-contact" className={field} maxLength={150} {...register("contact")} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="add-score" className="text-xs font-medium text-ink/60">Score</label>
            <input id="add-score" type="number" min="0" step="any" className={field} {...register("score")} />
          </div>
          <div>
            <label htmlFor="add-max" className="text-xs font-medium text-ink/60">Sur</label>
            <input id="add-max" type="number" min="0" step="any" className={field} {...register("scoreMax")} />
          </div>
        </div>
        <div>
          <label htmlFor="add-niveau" className="text-xs font-medium text-ink/60">Niveau retenu</label>
          <select id="add-niveau" className={field} {...register("niveau")}>
            <option value="">Non défini</option>
            {ALL_LEVELS.map((l) => (
              <option key={l} value={l}>
                {l} · {LEVEL_INFO[l]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="add-note" className="text-xs font-medium text-ink/60">Note</label>
          <textarea id="add-note" rows={3} maxLength={1000} className={field} {...register("note")} />
        </div>
        {error && (
          <p role="alert" className="text-xs text-ebp-red-soft">
            {error}
          </p>
        )}
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full disabled:opacity-60">
          {isSubmitting ? "Enregistrement..." : "Ajouter le résultat"}
        </button>
      </form>
    </Modal>
  );
}

export default function TestsView() {
  const { user } = useAdminUser();
  const canEdit = user?.role === "secretaire";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchTestResults()
      .then((data) => {
        if (!isMounted) return;
        setResults(data);
        setError("");
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    const interval = setInterval(() => setReloadKey((k) => k + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const reload = async () => {
    setResults(await fetchTestResults());
  };

  const refresh = () => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  };

  const counts = useMemo(
    () => ({
      all: results.length,
      nouveau: results.filter((r) => r.statut === "nouveau").length,
      contacte: results.filter((r) => r.statut === "contacte").length,
      transmis: results.filter((r) => r.statut === "transmis").length,
    }),
    [results]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return results.filter(
      (r) =>
        (filter === "all" || r.statut === filter) &&
        (!q || r.nom.toLowerCase().includes(q) || (r.contact || "").toLowerCase().includes(q))
    );
  }, [results, query, filter]);

  const selected = results.find((r) => r.id === selectedId) || null;
  const availableFilters = canEdit ? FILTERS : FILTERS.filter((f) => f.id === "all");

  const stats = canEdit
    ? [
        { label: "Reçus", value: counts.all },
        { label: "À traiter", value: counts.nouveau },
        { label: "Contactés", value: counts.contacte },
        { label: "Transmis au PDG", value: counts.transmis },
      ]
    : [{ label: "Résultats transmis", value: counts.all }];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
            <ClipboardList size={24} className="text-ebp-blue" />
            Tests de niveau
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {canEdit
              ? "Résultats du Google Form « Level Test EBP », reçus automatiquement."
              : "Résultats transmis par le secrétariat après évaluation."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-xl border border-ink/10 bg-white px-4 py-2.5 text-xs font-semibold text-ink/70 shadow-sm hover:bg-surface"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-ebp-blue" : ""} />
            Actualiser
          </button>
          {canEdit && (
            <button type="button" onClick={() => setAddOpen(true)} className="btn-primary !px-5 !py-2.5">
              <Plus size={15} />
              Ajouter
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-ebp-blue/15 bg-ebp-blue/5 p-4 text-sm text-ink/70">
        <Info size={18} className="mt-0.5 shrink-0 text-ebp-blue" />
        <p>
          {canEdit ? (
            <>
              Ouvrez un résultat pour lire la rédaction, confirmer le <strong className="text-ink">niveau retenu</strong>, ajouter une note,
              puis le <strong className="text-ink">transmettre au PDG</strong>.
              <span className="hidden sm:inline">
                {" "}Le niveau estimé est calculé automatiquement (60 % de réussite par niveau) : il reste indicatif tant que la
                rédaction n'est pas corrigée.
              </span>
            </>
          ) : (
            <>Seuls les résultats évalués et transmis par le secrétariat apparaissent ici.</>
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ebp-red-soft">
          {error}
        </p>
      )}

      <div className={`mt-5 grid gap-3 ${canEdit ? "grid-cols-2 lg:grid-cols-4" : "grid-cols-1 sm:max-w-xs"}`}>
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-ink/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/40">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un candidat…"
            aria-label="Rechercher un candidat"
            className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-blue"
          />
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2">
            {availableFilters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  filter === f.id
                    ? "border-ebp-blue bg-ebp-blue text-white"
                    : "border-ink/10 bg-white text-ink/65 hover:border-ebp-blue/40"
                }`}
              >
                {f.label} <span className="opacity-70">({counts[f.id]})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {!loading && filtered.length === 0 ? (
        <div className="mt-5 flex flex-col items-center rounded-2xl border border-dashed border-ink/15 bg-white px-6 py-14 text-center">
          <Inbox size={32} className="text-ink/25" />
          <p className="mt-3 font-semibold text-ink/70">Aucun résultat pour le moment.</p>
          <p className="mt-1 max-w-md text-xs text-ink/45">
            {results.length > 0
              ? "Ajustez la recherche ou le filtre."
              : canEdit
              ? "Les réponses au test de niveau apparaissent ici dès qu'un candidat termine le formulaire."
              : "Le secrétariat vous transmettra les résultats évalués."}
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 space-y-3 md:hidden">
            {filtered.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedId(r.id)}
                className="block w-full rounded-2xl border border-ink/10 bg-white p-4 text-left shadow-sm active:bg-surface"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{r.nom}</p>
                    <p className="mt-0.5 truncate text-xs text-ink/50">{r.contact || "Contact non renseigné"}</p>
                  </div>
                  <LevelBadge level={finalLevel(r)} />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-ink/50">
                  <span>
                    {r.score != null ? `${r.score}${r.score_max ? ` / ${r.score_max}` : ""}` : "Sans score"} · {formatDate(r.passe_le)}
                  </span>
                  <StatusBadge status={r.statut} />
                </div>
              </button>
            ))}
          </div>

          <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-ink/10 bg-white shadow-sm md:block">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink/10 bg-surface/50 text-xs uppercase tracking-wide text-ink/40">
                  <th className="px-4 py-3.5">Candidat</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Score</th>
                  <th className="px-4 py-3.5">Niveau</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="w-10 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const pct = scorePercent(r);
                  return (
                    <tr
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className="cursor-pointer border-b border-ink/5 transition-colors last:border-0 hover:bg-surface/80"
                    >
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-ink">{r.nom}</p>
                        <p className="text-xs text-ink/45">{r.contact || "Contact non renseigné"}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs text-ink/60">{formatDate(r.passe_le)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="font-semibold text-ink">
                          {r.score != null ? `${r.score}${r.score_max ? ` / ${r.score_max}` : ""}` : "—"}
                        </span>
                        {pct !== null && <span className="ml-1.5 text-xs text-ink/45">{pct} %</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <LevelBadge level={finalLevel(r)} />
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={r.statut} />
                      </td>
                      <td className="px-4 py-3.5 text-ink/25">
                        <ChevronRight size={16} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {loading && results.length === 0 && <p className="mt-6 text-center text-xs text-ink/40">Chargement des résultats…</p>}

      {selected && (
        <DetailModal
          key={`${selected.id}-${selected.statut}`}
          result={selected}
          canEdit={canEdit}
          onClose={() => setSelectedId(null)}
          onChanged={reload}
        />
      )}
      {canEdit && <AddModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={reload} />}
    </div>
  );
}

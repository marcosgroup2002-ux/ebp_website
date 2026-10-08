import { useEffect, useState } from "react";
import { Tag, Save, Info, CheckCircle2 } from "lucide-react";
import { fetchTarifs, updateTarif, FORMULA_LABELS } from "../../services/tarifsService";
import { formatFcfa } from "../../data/adminData";

const OPTIONS = ["echelonne", "bloc"];

function TarifCard({ option, tarif, onSaved }) {
  const [value, setValue] = useState(String(tarif.amount));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const amount = Number(value);
  const changed = amount !== tarif.amount;
  const valid = Number.isFinite(amount) && amount >= 1000 && amount <= 2000000;

  const save = async (e) => {
    e.preventDefault();
    if (!changed || !valid || saving) return;
    const confirmed = window.confirm(
      `Passer le tarif « ${FORMULA_LABELS[option]} » de ${formatFcfa(tarif.amount)} à ${formatFcfa(amount)} ?\n\n` +
        "Le nouveau prix s'applique uniquement aux prochaines inscriptions."
    );
    if (!confirmed) return;

    setSaving(true);
    setError("");
    try {
      await onSaved(option, amount);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ebp-blue/10 text-ebp-blue">
          <Tag size={17} />
        </span>
        <h2 className="font-display text-base font-bold text-ink">{FORMULA_LABELS[option]}</h2>
      </div>

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-ink/40">Tarif actuel</p>
      <p className="mt-1 font-display text-3xl font-bold text-ebp-blue">{formatFcfa(tarif.amount)}</p>
      {tarif.updatedBy && (
        <p className="mt-1 text-xs text-ink/40">
          Modifié par {tarif.updatedBy} le {new Date(tarif.updatedAt).toLocaleString("fr-FR")}
        </p>
      )}

      <label htmlFor={`tarif-${option}`} className="mt-5 block text-xs font-medium text-ink/60">
        Nouveau tarif (FCFA)
      </label>
      <input
        id={`tarif-${option}`}
        type="number"
        inputMode="numeric"
        min="1000"
        max="2000000"
        step="1000"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-ink/10 bg-surface px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ebp-green"
      />
      {!valid && <p className="mt-1 text-xs text-ebp-red-soft">Le tarif doit être compris entre 1 000 et 2 000 000 F.</p>}
      {error && (
        <p role="alert" className="mt-2 text-xs text-ebp-red-soft">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!changed || !valid || saving}
        className="btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
        {saving ? "Enregistrement..." : saved ? "Tarif enregistré" : "Enregistrer le nouveau tarif"}
      </button>
    </form>
  );
}

export default function TarifsView() {
  const [tarifs, setTarifs] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetchTarifs()
      .then((data) => {
        if (isMounted) setTarifs(data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async (option, amount) => {
    setTarifs(await updateTarif(option, amount));
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Tarifs des formules</h1>
      <p className="mt-1 text-sm text-ink/50">Ajustez les prix selon la saison ou les offres en cours.</p>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-ebp-blue/15 bg-ebp-blue/5 p-4 text-sm text-ink/70">
        <Info size={18} className="mt-0.5 shrink-0 text-ebp-blue" />
        <p>
          Un nouveau tarif s'applique <strong className="text-ink">uniquement aux prochaines inscriptions</strong>. Les
          apprenants déjà inscrits conservent le montant de leur contrat. Chaque modification est enregistrée dans le
          journal d'audit de la direction.
        </p>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-ebp-red-soft">
          {error}
        </p>
      )}

      {!tarifs && !error && <p className="mt-6 text-sm text-ink/40">Chargement des tarifs...</p>}

      {tarifs && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {OPTIONS.filter((option) => tarifs[option]).map((option) => (
            <TarifCard
              key={option}
              option={option}
              tarif={tarifs[option]}
              onSaved={handleSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

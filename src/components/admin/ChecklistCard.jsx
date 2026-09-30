import { useEffect, useState } from "react";
import { RotateCcw, Flag, Check } from "lucide-react";
import {
  toggleChecklistItem,
  formatTimestamp,
  fetchChecklistEntries,
  saveChecklistEntry,
} from "../../services/checklistsService";

export default function ChecklistCard({ title, items, user, flaggableItem, onFlag, checklistKey }) {
  const [state, setState] = useState({});
  const [flaggedIndex, setFlaggedIndex] = useState(null);

  useEffect(() => {
    if (!checklistKey) return;
    let isMounted = true;
    fetchChecklistEntries(checklistKey).then((entries) => {
      if (isMounted && Object.keys(entries).length > 0) {
        setState(entries);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [checklistKey]);

  const toggle = (i) => {
    const isChecking = !state[i]?.checked;
    if (checklistKey) {
      saveChecklistEntry(checklistKey, i, isChecking, user);
    }
    setState((s) => toggleChecklistItem(s, i, user));
  };

  const reset = () => {
    if (checklistKey) {
      items.forEach((_, i) => {
        if (state[i]?.checked) {
          saveChecklistEntry(checklistKey, i, false, user);
        }
      });
    }
    setState({});
  };

  const done = Object.values(state).filter((v) => v?.checked).length;

  const handleFlag = (item, index) => {
    onFlag(item);
    setFlaggedIndex(index);
    setTimeout(() => setFlaggedIndex(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-6">
      <div className="flex items-center justify-between">
        <p className="font-display text-sm font-semibold text-ink">{title}</p>
        <span className="text-xs text-ink/40">
          {done}/{items.length}
        </span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-ebp-green transition-all"
          style={{ width: `${(done / items.length) * 100}%` }}
        />
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item, i) => {
          const entry = state[i];
          const isFlaggable = item === flaggableItem;
          return (
            <li key={i}>
              <div className="flex items-start gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(entry?.checked)}
                  onChange={() => toggle(i)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-ebp-green"
                />
                <div className="min-w-0 flex-1">
                  <label
                    onClick={() => toggle(i)}
                    className={`cursor-pointer ${entry?.checked ? "text-ink/40 line-through" : "text-ink/75"}`}
                  >
                    {item}
                  </label>
                  {entry?.checked && (
                    <p className="mt-0.5 text-[11px] text-ink/35">
                      {entry.by} · {formatTimestamp(entry.at)}
                    </p>
                  )}
                </div>
                {isFlaggable && (
                  <button
                    onClick={() => handleFlag(item, i)}
                    title="Signaler au Manager"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${
                      flaggedIndex === i ? "bg-ebp-green/15 text-ebp-green" : "text-ebp-red-soft hover:bg-red-50"
                    }`}
                  >
                    {flaggedIndex === i ? <Check size={12} /> : <Flag size={12} />}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button
        onClick={reset}
        className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink/40 hover:text-ebp-blue"
      >
        <RotateCcw size={12} />
        Réinitialiser
      </button>
    </div>
  );
}

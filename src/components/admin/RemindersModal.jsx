import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";
import Modal from "./Modal";
import { buildReminderMessage } from "../../services/paymentsService";
import { formatFcfa } from "../../data/adminData";
import { buildWhatsAppLink } from "../../lib/whatsapp";

export default function RemindersModal({ open, onClose, stage, learners }) {
  const [copiedId, setCopiedId] = useState(null);

  const copy = async (id, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Presse-papiers indisponible (contexte non sécurisé, permissions) : pas bloquant.
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={stage === "J5" ? "Relance J5 · premiers impayés" : "Relance J10 · dernière relance"}
      maxWidth="max-w-lg"
    >
      <p className="text-sm text-ink/50">
        {learners.length} apprenant{learners.length > 1 ? "s" : ""} concerné{learners.length > 1 ? "s" : ""}.
        Message pré-rempli selon le modèle du Playbook (Partie 3.3).
      </p>

      <div className="mt-4 space-y-3">
        {learners.length === 0 && (
          <p className="rounded-xl bg-surface p-4 text-center text-sm text-ink/40">
            Aucun apprenant à ce stade de relance en ce moment.
          </p>
        )}
        {learners.map((l) => {
          const message = buildReminderMessage(l, stage);
          return (
            <div key={l.id} className="rounded-xl border border-ink/10 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{l.name}</p>
                <span className="text-xs text-ink/40">Dû : {formatFcfa(l.total - l.paid)}</span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink/60">{message}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => copy(l.id, message)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/60 hover:bg-surface"
                >
                  {copiedId === l.id ? <Check size={12} className="text-ebp-green" /> : <Copy size={12} />}
                  {copiedId === l.id ? "Copié" : "Copier"}
                </button>
                <a
                  href={buildWhatsAppLink(message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-ebp-green/10 px-3 py-1.5 text-xs font-medium text-ebp-green hover:bg-ebp-green/20"
                >
                  <MessageCircle size={12} />
                  Ouvrir dans WhatsApp
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

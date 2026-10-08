import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";

function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

const getSnapshot = () => navigator.onLine;
const getServerSnapshot = () => true;

export default function OfflineBanner() {
  const online = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[100] flex items-center justify-center gap-2 bg-ebp-red-soft px-4 py-2 text-xs font-semibold text-white shadow-md"
    >
      <WifiOff size={14} />
      Connexion Internet perdue : les modifications ne peuvent pas être enregistrées pour le moment.
    </div>
  );
}

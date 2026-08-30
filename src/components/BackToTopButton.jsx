import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Revenir en haut de la page"
      className="fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white text-ebp-blue shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card sm:bottom-24 sm:right-6 sm:h-12 sm:w-12"
    >
      <ArrowUp size={20} />
    </button>
  );
}

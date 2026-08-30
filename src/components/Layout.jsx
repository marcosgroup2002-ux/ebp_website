import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import WhatsAppFloatingButton from "./WhatsAppFloatingButton";
import BackToTopButton from "./BackToTopButton";

export default function Layout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    window.scrollTo({ top: 0 });
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-surface font-body text-ink">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloatingButton />
      <BackToTopButton />
    </div>
  );
}

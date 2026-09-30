import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";

// Chargement différé (Lazy Loading) des routes secondaires pour alléger le bundle initial
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminGate = lazy(() => import("./pages/admin/AdminGate"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const PaymentsView = lazy(() => import("./pages/admin/PaymentsView"));
const ChecklistsView = lazy(() => import("./pages/admin/ChecklistsView"));

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ebp-blue border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Site public */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* Espace admin : jamais lié depuis la navigation publique */}
        <Route path="/admin" element={<AdminGate />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/paiements" replace />} />
            <Route path="paiements" element={<PaymentsView />} />
            <Route path="checklists" element={<ChecklistsView />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

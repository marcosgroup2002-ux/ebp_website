import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { useAdminUser } from "./context/AdminUserContext";

const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminGate = lazy(() => import("./pages/admin/AdminGate"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const PaymentsView = lazy(() => import("./pages/admin/PaymentsView"));
const ChecklistsView = lazy(() => import("./pages/admin/ChecklistsView"));
const CoachsView = lazy(() => import("./pages/admin/CoachsView"));
const PdgSupervisionView = lazy(() => import("./pages/admin/PdgSupervisionView"));
const AuditLogsView = lazy(() => import("./pages/admin/AuditLogsView"));
const AnalyticsView = lazy(() => import("./pages/admin/AnalyticsView"));
import AnalyticsTracker from "./components/AnalyticsTracker";

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-ebp-blue border-t-transparent" />
    </div>
  );
}

function AdminIndexRedirect() {
  const { user } = useAdminUser();
  if (user?.role === "coach") return <Navigate to="/admin/coachs" replace />;
  if (user?.role === "pdg") return <Navigate to="/admin/pdg" replace />;
  return <Navigate to="/admin/paiements" replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AnalyticsTracker />
      <Routes>

        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        <Route path="/admin" element={<AdminGate />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminIndexRedirect />} />
            <Route path="paiements" element={<PaymentsView />} />
            <Route path="checklists" element={<ChecklistsView />} />
            <Route path="coachs" element={<CoachsView />} />
            <Route path="pdg" element={<PdgSupervisionView />} />
            <Route path="audit" element={<AuditLogsView />} />
            <Route path="analytics" element={<AnalyticsView />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

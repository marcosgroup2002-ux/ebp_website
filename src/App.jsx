import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import About from "./pages/About";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Contact from "./pages/Contact";
import AdminGate from "./pages/admin/AdminGate";
import AdminLayout from "./pages/admin/AdminLayout";
import PaymentsView from "./pages/admin/PaymentsView";
import ChecklistsView from "./pages/admin/ChecklistsView";

export default function App() {
  return (
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
  );
}

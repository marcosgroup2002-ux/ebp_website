import { Navigate } from "react-router-dom";
import { useAdminUser } from "../../context/AdminUserContext";

export default function AdminIndexRedirect() {
  const { user } = useAdminUser();
  if (user?.role === "coach") return <Navigate to="/admin/coachs" replace />;
  if (user?.role === "pdg") return <Navigate to="/admin/pdg" replace />;
  if (user?.role === "secretaire") return <Navigate to="/admin/paiements" replace />;
  return null;
}

import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

// roles is optional, e.g. <ProtectedRoute roles={["admin"]}>
function ProtectedRoute({ children, roles }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <p className="auth-loading">Loading...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(profile?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
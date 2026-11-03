import { Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

function GuestRoute({ children }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <p className="auth-loading">Loading...</p>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default GuestRoute;
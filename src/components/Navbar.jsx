import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import NotificationBell from "./NotificationBell";

function Navbar() {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.full_name ?? user?.email;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        E-Kaniko
      </Link>

      <div className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/vehicles">Vehicles</NavLink>
        <NavLink to="/diagnosis">AI Diagnosis</NavLink>
        <NavLink to="/shops">Shops</NavLink>
        <NavLink to="/bookings">Bookings</NavLink>

        {profile?.role === "admin" && (
          <NavLink to="/admin">Admin</NavLink>
        )}

        {user && (
          <>
            <NotificationBell />

            <span className="navbar-user">{displayName}</span>
            <button
              type="button"
              className="navbar-logout"
              onClick={signOut}
            >
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

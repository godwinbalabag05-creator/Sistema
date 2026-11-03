import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

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

        {user && (
          <>
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
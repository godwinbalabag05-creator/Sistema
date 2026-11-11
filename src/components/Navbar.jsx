import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import NotificationBell from "./NotificationBell";
import VerifyBanner from "./VerifyBanner";
import { useAuth } from "../lib/AuthContext";

function Navbar() {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = profile?.full_name ?? user?.email;
  const isAdmin = profile?.role === "admin";
  const isMechanic = profile?.role === "mechanic";

  // Escape closes the mobile menu
  useEffect(() => {
    if (!menuOpen) return undefined;

    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="navbar-brand">
          E-Kaniko
        </Link>

        <div
          id="main-menu"
          className={`navbar-menu ${menuOpen ? "is-open" : ""}`}
          onClick={(e) => {
            if (e.target.closest("a")) setMenuOpen(false);
          }}
        >
          <div className="navbar-links">
            {isMechanic ? (
              <NavLink to="/mechanic">My jobs</NavLink>
            ) : (
              <>
                <NavLink to="/" end>Home</NavLink>
                <NavLink to="/vehicles">Vehicles</NavLink>
                <NavLink to="/diagnosis">AI Diagnosis</NavLink>
                <NavLink to="/shops">Shops</NavLink>
                <NavLink to="/bookings">Bookings</NavLink>
                {isAdmin && <NavLink to="/admin">Admin</NavLink>}
              </>
            )}
          </div>

          {user && (
            <div className="navbar-account">
              <Link to="/profile" className="navbar-user" title="Your profile">
                {displayName}
              </Link>
              {isAdmin && <span className="role-tag">Admin</span>}
              {isMechanic && <span className="role-tag">Mechanic</span>}

              <button
                type="button"
                className="navbar-logout"
                onClick={signOut}
              >
                Log out
              </button>
            </div>
          )}
        </div>

        {user && <NotificationBell />}

        <button
          type="button"
          className={`nav-toggle ${menuOpen ? "is-open" : ""}`}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <VerifyBanner />
    </>
  );
}

export default Navbar;
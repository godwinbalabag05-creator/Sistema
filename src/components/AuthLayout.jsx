import { Link } from "react-router-dom";
import { AdBackdrop, AdScenes } from "./AdStage";

function AuthLayout({ title, aside, children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <AdBackdrop />

        <Link to="/" className="navbar-brand">
          E-Kaniko
        </Link>

        <AdScenes />

        <div className="auth-aside-foot">
          <h2>{title}</h2>
          {aside}

          <small>
            AI estimates only. Always have a certified mechanic inspect your
            vehicle.
          </small>
        </div>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}

export default AuthLayout;
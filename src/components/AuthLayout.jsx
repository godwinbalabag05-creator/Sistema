import { Link } from "react-router-dom";

function AuthLayout({ title, aside, children }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="navbar-brand">
          E-Kaniko
        </Link>

        <div>
          <h2>{title}</h2>
          {aside}
        </div>

        <small>
          AI estimates only. Always have a certified mechanic inspect your
          vehicle.
        </small>
      </aside>

      <main className="auth-main">{children}</main>
    </div>
  );
}

export default AuthLayout;
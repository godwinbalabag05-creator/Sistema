import { Link, Outlet, useLocation } from "react-router-dom";
import { AdBackdrop, AdScenes } from "./AdStage";

const CONTENT = {
  "/login": {
    title: "Pick up where you left off.",
    aside: (
      <p>
        Your vehicles and past diagnoses are saved to your account, so you
        can check what was flagged before you book a repair.
      </p>
    ),
  },
  "/register": {
    title: "Know the problem before you book the repair.",
    aside: (
      <ol className="auth-steps">
        <li>Describe what your car is doing.</li>
        <li>Answer a few follow-up questions.</li>
        <li>
          Get the likely cause, how urgent it is, and a shop that can fix it.
        </li>
      </ol>
    ),
  },
  "/forgot-password": {
    title: "Locked out? It happens.",
    aside: (
      <p>
        Enter the email you registered with and we'll send you a link to set
        a new password.
      </p>
    ),
  },
    "/email-confirmed": {
    title: "You're all set.",
    aside: (
      <p>
        Your email is confirmed. Add your vehicle and start your first
        diagnosis whenever you're ready.
      </p>
    ),
  },
  "/reset-password": {
    title: "Choose a new password.",
    aside: (
      <p>
        Pick one you haven't used before. You'll be signed in as soon as it's
        saved.
      </p>
    ),
  },
};

function AuthLayout() {
  const { pathname } = useLocation();
  const content = CONTENT[pathname] ?? CONTENT["/login"];

  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <AdBackdrop />

        <Link to="/" className="navbar-brand">
          E-Kaniko
        </Link>

        <AdScenes />

        {/* The key restarts only this block's fade when the page changes */}
        <div className="auth-aside-foot" key={pathname}>
          <h2>{content.title}</h2>
          {content.aside}

          <small>
            AI estimates only. Always have a certified mechanic inspect your
            vehicle.
          </small>
        </div>
      </aside>

      <main className="auth-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AuthLayout;
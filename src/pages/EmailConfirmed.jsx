import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../lib/AuthContext";

// If the email link was expired or already used, Supabase adds an error to the address
function readLinkError() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

  return (
    query.get("error_description") ||
    hash.get("error_description") ||
    query.get("error") ||
    hash.get("error") ||
    ""
  );
}

function CheckIcon({ warn }) {
  return (
    <span className={`verify-check ${warn ? "warn" : ""}`} aria-hidden="true">
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {warn ? <path d="M12 8v5M12 17h.01" /> : <path d="m5 12 5 5 9-10" />}
      </svg>
    </span>
  );
}

function EmailConfirmed() {
  const { session, loading } = useAuth();
  const [linkError] = useState(readLinkError);

  if (loading) {
    return (
      <div className="auth-form">
        <p className="auth-lead">Checking your link...</p>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="auth-form">
        <CheckIcon warn />
        <h1>Link not valid</h1>

        <p className="auth-lead">
          This confirmation link has expired or was already used. If you
          already confirmed your email, you can just log in.
        </p>

        <Link to="/login" className="primary-button auth-submit">
          Go to log in
        </Link>
      </div>
    );
  }

  if (session) {
    return (
      <div className="auth-form">
        <CheckIcon />
        <h1>Account confirmed</h1>

        <p className="auth-lead">
          Your email is confirmed and your E-Kaniko account is ready. You're
          already signed in.
        </p>

        <Link to="/" className="primary-button auth-submit">
          Go to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <CheckIcon />
      <h1>Your account is ready</h1>

      <p className="auth-lead">
        If you opened this page from the confirmation email, your email is
        confirmed and your account has been created. Log in to continue.
      </p>

      <Link to="/login" className="primary-button auth-submit">
        Go to log in
      </Link>
    </div>
  );
}

export default EmailConfirmed;
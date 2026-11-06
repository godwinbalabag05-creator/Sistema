import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

function ResetPassword() {
  const { session, loading } = useAuth();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setError("");
    setIsLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
  }

  if (loading) {
    return (
      <div className="auth-form">
        <p className="auth-lead">Checking your link...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="auth-form">
        <h1>Link expired</h1>

        <p className="auth-lead">
          This password reset link is invalid or has already been used.
          Request a new one and open it in this same browser.
        </p>

        <Link to="/forgot-password" className="primary-button auth-submit">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="auth-form">
        <h1>Password updated</h1>
        <p className="form-notice">Your new password is saved.</p>

        <Link to="/" className="primary-button auth-submit">
          Go to your dashboard
        </Link>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>Set a new password</h1>
      <p className="auth-lead">Use at least 6 characters.</p>

      <label htmlFor="password">New password</label>
      <input
        id="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <label htmlFor="confirm">Confirm new password</label>
      <input
        id="confirm"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
      />

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="primary-button auth-submit"
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save password"}
      </button>
    </form>
  );
}

export default ResetPassword;
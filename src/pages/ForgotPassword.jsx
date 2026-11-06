import { useState } from "react";
import { Link } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase is not connected. Check your .env.local file.");
      return;
    }

    setError("");
    setIsLoading(true);

    const { error: sendError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setIsLoading(false);

    if (sendError) {
      setError(sendError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="auth-form">
        <h1>Check your email</h1>

        <p className="form-notice">
          If an account exists for {email.trim()}, a link to reset your
          password is on its way. It can take a minute, so check your spam
          folder too.
        </p>

        <p className="auth-switch">
          Wrong address?{" "}
          <button
            type="button"
            className="text-button"
            onClick={() => setSent(false)}
          >
            Try again
          </button>
        </p>

        <p className="auth-switch">
          Back to <Link to="/login">Log in</Link>
        </p>
      </div>
    );
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>Forgot your password?</h1>
      <p className="auth-lead">
        We'll email you a link to choose a new one.
      </p>

      <label htmlFor="email">Email</label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />

      {error && <p className="form-error">{error}</p>}

      <button
        type="submit"
        className="primary-button auth-submit"
        disabled={isLoading}
      >
        {isLoading ? "Sending..." : "Send reset link"}
      </button>

      <p className="auth-switch">
        Remembered it? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}

export default ForgotPassword;
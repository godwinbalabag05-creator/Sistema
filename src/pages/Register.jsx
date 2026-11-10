import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { supabase } from "../lib/supabaseClient";

function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (!supabase) {
      setError("Supabase is not connected. Check your .env.local file.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setNotice("");
    setIsLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/email-confirmed`,
      },
    });

    setIsLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // With email confirmation on, there is no session until the link is clicked
    if (!data.session) {
      setNotice("Account created. Confirm your email, then log in.");
      return;
    }

    navigate("/");
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>Create your account</h1>
      <p className="auth-lead">
        Save your vehicles and keep every diagnosis in one place.
      </p>

      <label htmlFor="fullName">Full name</label>
      <input
        id="fullName"
        type="text"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Gopaks, Tonix, Vincent"
        required
      />

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

      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 6 characters"
        required
      />

      {error && <p className="form-error">{error}</p>}
      {notice && <p className="form-notice">{notice}</p>}

      <button
        type="submit"
        className="primary-button auth-submit"
        disabled={isLoading}
      >
        {isLoading ? "Creating account..." : "Create account"}
      </button>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}

export default Register;
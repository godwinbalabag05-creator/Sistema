import { useEffect, useState } from "react";

import Navbar from "../components/NavBar";
import ListSkeleton from "../components/ListSkeleton";
import PhoneVerifyModal from "../components/PhoneVerifyModal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { formatPhone } from "../lib/phone";

const ROLE_LABEL = { user: "Owner", mechanic: "Mechanic", admin: "Admin" };
const STRENGTH_LABEL = ["Too short", "Weak", "Fair", "Good", "Strong"];

function initials(name) {
  return (name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "long" });
}

function strengthOf(password) {
  if (password.length < 6) return 0;

  let score = 1;
  if (password.length >= 10) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  return Math.min(score, 4);
}

function SettingsCard({ title, description, footer, children }) {
  return (
    <section className="settings-card">
      <header className="settings-card-head">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <div className="settings-card-body">{children}</div>

      {footer && <footer className="settings-card-foot">{footer}</footer>}
    </section>
  );
}

function DetailsCard({ profile, onSaved }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const dirty = fullName.trim() !== (profile.full_name ?? "");

  async function handleSubmit(e) {
    e.preventDefault();

    const name = fullName.trim();

    if (!name) {
      setError("Enter your name.");
      return;
    }

    setError("");
    setNotice("");
    setIsSaving(true);

    const { error: saveError } = await supabase
      .from("users")
      .update({ full_name: name })
      .eq("id", profile.id);

    if (saveError) {
      setIsSaving(false);
      setError(saveError.message);
      return;
    }

    await onSaved();
    setIsSaving(false);
    setNotice("Your details were saved.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsCard
        title="Personal details"
        description="The name shop owners see on your bookings."
        footer={
          <button
            type="submit"
            className="primary-button"
            disabled={!dirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        }
      >
        <div className="field-grid">
          <div>
            <label htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setNotice("");
              }}
              required
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <input id="email" value={profile.email} readOnly />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-notice">{notice}</p>}
      </SettingsCard>
    </form>
  );
}

function PhoneCard({ profile, onOpen }) {
  const verified = Boolean(profile.phone_verified_at);

  return (
    <SettingsCard
      title="Phone number"
      description="Shops use a verified number to confirm that a booking is real."
      footer={
        <button type="button" className="primary-button" onClick={onOpen}>
          {verified ? "Change number" : "Verify number"}
        </button>
      }
    >
      <div className="phone-row">
        <div>
          <strong>
            {profile.phone ? formatPhone(profile.phone) : "No number added"}
          </strong>
          <span>
            {verified
              ? `Verified on ${formatDate(profile.phone_verified_at)}`
              : "Not verified yet. You can't request bookings until it is."}
          </span>
        </div>

        <span className={`verify-badge ${verified ? "ok" : "no"}`}>
          {verified ? "Verified" : "Unverified"}
        </span>
      </div>
    </SettingsCard>
  );
}

function PasswordCard({ email }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const strength = strengthOf(next);

  async function handleSubmit(e) {
    e.preventDefault();

    if (next.length < 6) {
      setError("The new password must be at least 6 characters.");
      return;
    }

    if (next !== confirm) {
      setError("The two new passwords don't match.");
      return;
    }

    if (next === current) {
      setError("Choose a password different from the current one.");
      return;
    }

    setError("");
    setNotice("");
    setIsSaving(true);

    // Confirm it's really the account owner before changing anything
    const { error: checkError } = await supabase.auth.signInWithPassword({
      email,
      password: current,
    });

    if (checkError) {
      setIsSaving(false);
      setError(
        checkError.message.toLowerCase().includes("invalid")
          ? "Your current password is incorrect."
          : checkError.message
      );
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: next,
    });

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setNotice("Your password was changed.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <SettingsCard
        title="Password"
        description="Use at least 6 characters. A longer mix of letters, numbers and symbols is stronger."
        footer={
          <button
            type="submit"
            className="primary-button"
            disabled={isSaving || !current || !next || !confirm}
          >
            {isSaving ? "Saving..." : "Change password"}
          </button>
        }
      >
        <div className="field-grid">
          <div className="span-2">
            <label htmlFor="current">Current password</label>
            <input
              id="current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="next">New password</label>
            <input
              id="next"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />

            {next && (
              <div className={`strength s${strength}`}>
                <i className={strength >= 1 ? "on" : ""} />
                <i className={strength >= 2 ? "on" : ""} />
                <i className={strength >= 3 ? "on" : ""} />
                <i className={strength >= 4 ? "on" : ""} />
                <span>{STRENGTH_LABEL[strength]}</span>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmNext">Confirm new password</label>
            <input
              id="confirmNext"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {notice && <p className="form-notice">{notice}</p>}
      </SettingsCard>
    </form>
  );
}

function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [counts, setCounts] = useState(null);

  const userId = user?.id;

  useEffect(() => {
    if (!supabase || !userId) return undefined;

    let ignore = false;

    Promise.all([
      supabase
        .from("vehicles")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", userId),
    ]).then(([vehicles, bookings]) => {
      if (ignore) return;
      setCounts({
        vehicles: vehicles.count ?? 0,
        bookings: bookings.count ?? 0,
      });
    });

    return () => {
      ignore = true;
    };
  }, [userId]);

  const verified = Boolean(profile?.phone_verified_at);

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Your profile</h1>
            <p>Manage your details and keep your account secure.</p>
          </div>
        </div>

        {!profile && <ListSkeleton rows={2} />}

        {profile && (
          <div className="profile-layout">
            <aside className="profile-side">
              <div className="profile-avatar-lg" aria-hidden="true">
                {initials(profile.full_name)}
              </div>

              <h2>{profile.full_name || "No name yet"}</h2>
              <span className="role-tag">
                {ROLE_LABEL[profile.role] ?? profile.role}
              </span>
              <p className="profile-email">{profile.email}</p>

              <div className="profile-facts">
                <div>
                  <span>Member since</span>
                  <strong>{formatDate(profile.created_at)}</strong>
                </div>

                <div>
                  <span>Phone</span>
                  <strong>
                    {verified ? "Verified" : "Not verified"}
                  </strong>
                </div>
              </div>

              <div className="profile-stats">
                <div>
                  <strong>{counts ? counts.vehicles : "-"}</strong>
                  <span>Vehicles</span>
                </div>

                <div>
                  <strong>{counts ? counts.bookings : "-"}</strong>
                  <span>Bookings</span>
                </div>
              </div>

              <button type="button" className="side-button" onClick={signOut}>
                Log out
              </button>
            </aside>

            <div className="profile-main">
              <DetailsCard
                key={profile.id}
                profile={profile}
                onSaved={refreshProfile}
              />

              <PhoneCard profile={profile} onOpen={() => setPhoneOpen(true)} />

              <PasswordCard email={profile.email} />
            </div>
          </div>
        )}
      </main>

      <PhoneVerifyModal
        open={phoneOpen}
        onClose={() => setPhoneOpen(false)}
        initialPhone={profile?.phone ?? ""}
        onVerified={refreshProfile}
      />
    </>
  );
}

export default Profile;
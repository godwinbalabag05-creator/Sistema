import { useState } from "react";

import { supabase } from "../lib/supabaseClient";

function AddressCard({ profile, onSaved }) {
  const [address, setAddress] = useState(profile.address ?? "");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const dirty = address.trim() !== (profile.address ?? "");

  async function handleSubmit(e) {
    e.preventDefault();

    const place = address.trim();

    if (place && place.length < 8) {
      setError("Enter a fuller address, with the street, barangay and city.");
      return;
    }

    setError("");
    setNotice("");
    setIsSaving(true);

    const { error: saveError } = await supabase
      .from("users")
      .update({ address: place || null })
      .eq("id", profile.id);

    if (saveError) {
      setIsSaving(false);
      setError(saveError.message);
      return;
    }

    await onSaved();
    setIsSaving(false);
    setNotice("Your service address was saved.");
  }

  return (
    <form onSubmit={handleSubmit}>
      <section className="settings-card">
        <header className="settings-card-head">
          <h2>Service address</h2>
          <p>
            Where a mechanic should find you or your car. It's shared with the
            shop when you book, and you can change it for each booking.
          </p>
        </header>

        <div className="settings-card-body">
          <label htmlFor="serviceAddress">Address and landmark</label>
          <textarea
            id="serviceAddress"
            rows={3}
            maxLength={250}
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setNotice("");
            }}
            placeholder="House or building, street, barangay, city. Add a landmark if you can."
          />

          {error && <p className="form-error">{error}</p>}
          {notice && <p className="form-notice">{notice}</p>}
        </div>

        <footer className="settings-card-foot">
          <button
            type="submit"
            className="primary-button"
            disabled={!dirty || isSaving}
          >
            {isSaving ? "Saving..." : "Save address"}
          </button>
        </footer>
      </section>
    </form>
  );
}

export default AddressCard;
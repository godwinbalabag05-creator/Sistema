import { useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { formatPhone } from "../lib/phone";

// Value for the "earliest allowed" date input, in local time
function nowLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function BookingFormWithDiagnosis({
  shop,
  vehicle,
  onDone,
  onCancel,
  initialDiagnosisId = "",
}) {
  const { user, profile, refreshProfile } = useAuth();
  const userId = user?.id;

  const [when, setWhen] = useState("");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [problem, setProblem] = useState("");
  const [saveAddress, setSaveAddress] = useState(!profile?.address);
  const [diagnoses, setDiagnoses] = useState([]);
  const [diagnosisId, setDiagnosisId] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // This vehicle's saved diagnoses, newest first
  useEffect(() => {
    if (!supabase || !userId) return undefined;

    let ignore = false;

    supabase
      .from("diagnoses")
      .select(
        "id, title, summary, severity, created_at, conversations!inner(owner_id, vehicle_id)"
      )
      .eq("conversations.owner_id", userId)
      .eq("conversations.vehicle_id", vehicle.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (ignore) return;

        const list = data ?? [];
        setDiagnoses(list);

        const preselected = list.find((d) => d.id === initialDiagnosisId);

        if (preselected) {
          setDiagnosisId(preselected.id);
          setProblem(
            (current) =>
              current || `${preselected.title}. ${preselected.summary}`.slice(0, 500)
          );
        }
      });

    return () => {
      ignore = true;
    };
  }, [userId, vehicle.id, initialDiagnosisId]);

  function handleDiagnosis(e) {
    const id = e.target.value;
    setDiagnosisId(id);

    const picked = diagnoses.find((d) => d.id === id);

    if (picked) {
      setProblem(
        (current) => current || `${picked.title}. ${picked.summary}`.slice(0, 500)
      );
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const date = new Date(when);

    if (Number.isNaN(date.getTime()) || date < new Date()) {
      setError("Pick a date and time in the future.");
      return;
    }

    const place = address.trim();

    if (place.length < 8) {
      setError("Enter your service location so the mechanic can find you.");
      return;
    }

    setError("");
    setIsSaving(true);

    const { error: saveError } = await supabase.from("bookings").insert({
      owner_id: userId,
      vehicle_id: vehicle.id,
      shop_id: shop.id,
      requested_datetime: date.toISOString(),
      service_address: place,
      job_brief: problem.trim(),
      diagnosis_id: diagnosisId || null,
    });

    if (saveError) {
      setIsSaving(false);
      setError(saveError.message);
      return;
    }

    // Keep it as the default address for next time
    if (saveAddress && place !== (profile?.address ?? "")) {
      await supabase.from("users").update({ address: place }).eq("id", userId);
      await refreshProfile();
    }

    setIsSaving(false);
    onDone();
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <p className="booking-vehicle">
        Vehicle:{" "}
        <strong>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </strong>
      </p>

      <p className="share-note">
        The shop will receive your name
        {profile?.phone ? ` and verified number (${formatPhone(profile.phone)})` : ""},
        your vehicle, the problem, the location below
        {diagnosisId ? ", and the AI diagnosis you attached" : ""}.
      </p>

      <label htmlFor={`when-${shop.id}`}>Preferred date and time</label>
      <input
        id={`when-${shop.id}`}
        type="datetime-local"
        min={nowLocal()}
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        required
      />

      <label htmlFor={`diagnosis-${shop.id}`}>
        Attach an AI diagnosis (optional)
      </label>
      <select
        id={`diagnosis-${shop.id}`}
        value={diagnosisId}
        onChange={handleDiagnosis}
      >
        <option value="">
          {diagnoses.length === 0
            ? "No saved diagnoses for this vehicle yet"
            : "Don't attach one"}
        </option>

        {diagnoses.map((d) => (
          <option key={d.id} value={d.id}>
            {d.title} ({d.severity},{" "}
            {new Date(d.created_at).toLocaleDateString("en-PH", {
              dateStyle: "medium",
            })}
            )
          </option>
        ))}
      </select>

      <label htmlFor={`place-${shop.id}`}>Service location</label>
      <textarea
        id={`place-${shop.id}`}
        rows={2}
        maxLength={250}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="House or building, street, barangay, city. Add a landmark if you can."
        required
      />

      {(!profile?.address || address.trim() !== profile.address) && (
        <label className="check-row" htmlFor={`save-${shop.id}`}>
          <input
            id={`save-${shop.id}`}
            type="checkbox"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
          />
          Save this as my default address
        </label>
      )}

      <label htmlFor={`problem-${shop.id}`}>
        What should the shop check?
      </label>
      <textarea
        id={`problem-${shop.id}`}
        rows={3}
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        placeholder="Example: Squealing noise when braking, pads may be worn."
        required
      />

      {error && <p className="form-error">{error}</p>}

      <div className="vehicle-form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSaving}
        >
          {isSaving ? "Sending..." : "Send request"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default BookingFormWithDiagnosis;
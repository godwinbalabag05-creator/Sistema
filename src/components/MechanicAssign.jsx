import { useEffect, useState } from "react";

import { supabase } from "../lib/supabaseClient";

function MechanicAssign({ shop }) {
  const [mechanics, setMechanics] = useState([]);
  const [value, setValue] = useState(shop.mechanic_id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    supabase
      .from("users")
      .select("id, full_name, email")
      .eq("role", "mechanic")
      .order("full_name")
      .then(({ data }) => {
        if (!ignore) setMechanics(data ?? []);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function handleChange(e) {
    const next = e.target.value;

    setError("");
    setMessage("");

    const { error: saveError } = await supabase
      .from("mechanic_shops")
      .update({ mechanic_id: next || null })
      .eq("id", shop.id);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    setValue(next);
    setMessage("Saved");
  }

  return (
    <div className="assign-row">
      <label htmlFor={`mechanic-${shop.id}`}>Assigned mechanic</label>

      <select
        id={`mechanic-${shop.id}`}
        value={value}
        onChange={handleChange}
      >
        <option value="">None</option>
        {mechanics.map((person) => (
          <option key={person.id} value={person.id}>
            {person.full_name || person.email}
          </option>
        ))}
      </select>

      {message && <span className="assign-saved">{message}</span>}
      {error && <span className="assign-error">{error}</span>}

      {mechanics.length === 0 && (
        <p className="assign-hint">
          No mechanic accounts yet. Change a user's role to Mechanic in Admin,
          then Users.
        </p>
      )}
    </div>
  );
}

export default MechanicAssign;
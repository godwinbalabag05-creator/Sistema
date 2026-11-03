import { useState } from "react";

const EMPTY = {
  make: "",
  model: "",
  year: "",
  engine: "",
  mileage: "",
  plate_number: "",
  fuel_type: "",
  transmission_type: "",
};

function fromVehicle(vehicle) {
  const values = { ...EMPTY };
  if (!vehicle) return values;

  for (const key of Object.keys(EMPTY)) {
    values[key] = vehicle[key] ?? "";
  }
  return values;
}

function VehicleForm({ vehicle, title, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => fromVehicle(vehicle));
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const year = Number(values.year);

    if (!Number.isInteger(year) || year < 1950 || year > 2100) {
      setError("Enter a valid year, like 2018.");
      return;
    }

    const payload = {
      make: values.make.trim(),
      model: values.model.trim(),
      year,
      engine: values.engine.trim() || null,
      mileage: values.mileage === "" ? null : Number(values.mileage),
      plate_number: values.plate_number.trim() || null,
      fuel_type: values.fuel_type || null,
      transmission_type: values.transmission_type || null,
    };

    setError("");
    setIsSaving(true);

    const { error: saveError } = await onSubmit(payload);

    setIsSaving(false);
    if (saveError) setError(saveError.message);
  }

  return (
    <form className="vehicle-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>

      <div className="vehicle-form-grid">
        <div>
          <label htmlFor="make">Make</label>
          <input
            id="make"
            name="make"
            value={values.make}
            onChange={handleChange}
            placeholder="Toyota"
            required
          />
        </div>

        <div>
          <label htmlFor="model">Model</label>
          <input
            id="model"
            name="model"
            value={values.model}
            onChange={handleChange}
            placeholder="Vios"
            required
          />
        </div>

        <div>
          <label htmlFor="year">Year</label>
          <input
            id="year"
            name="year"
            type="number"
            value={values.year}
            onChange={handleChange}
            placeholder="2018"
            required
          />
        </div>

        <div>
          <label htmlFor="engine">Engine</label>
          <input
            id="engine"
            name="engine"
            value={values.engine}
            onChange={handleChange}
            placeholder="1.3L Gasoline"
          />
        </div>

        <div>
          <label htmlFor="mileage">Mileage (km)</label>
          <input
            id="mileage"
            name="mileage"
            type="number"
            min="0"
            value={values.mileage}
            onChange={handleChange}
            placeholder="42300"
          />
        </div>

        <div>
          <label htmlFor="plate_number">Plate number</label>
          <input
            id="plate_number"
            name="plate_number"
            value={values.plate_number}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="fuel_type">Fuel type</label>
          <select
            id="fuel_type"
            name="fuel_type"
            value={values.fuel_type}
            onChange={handleChange}
          >
            <option value="">Not specified</option>
            <option value="Gasoline">Gasoline</option>
            <option value="Diesel">Diesel</option>
            <option value="Hybrid">Hybrid</option>
            <option value="Electric">Electric</option>
            <option value="LPG">LPG</option>
          </select>
        </div>

        <div>
          <label htmlFor="transmission_type">Transmission</label>
          <select
            id="transmission_type"
            name="transmission_type"
            value={values.transmission_type}
            onChange={handleChange}
          >
            <option value="">Not specified</option>
            <option value="Manual">Manual</option>
            <option value="Automatic">Automatic</option>
            <option value="CVT">CVT</option>
          </select>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="vehicle-form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : submitLabel}
        </button>

        {onCancel && (
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default VehicleForm;
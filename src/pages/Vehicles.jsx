import { useState } from "react";

import Navbar from "../components/Navbar";
import VehicleForm from "../components/VehicleForm";
import { useVehicles } from "../lib/VehicleContext";

function Vehicles() {
  const {
    vehicles,
    selectedVehicle,
    loading,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    selectVehicle,
  } = useVehicles();

  // null, "add", or the id of the vehicle being edited
  const [mode, setMode] = useState(null);

  const isAdding = mode === "add" || (!loading && vehicles.length === 0);
  const editingVehicle = vehicles.find((v) => v.id === mode);

  async function handleDelete(vehicle) {
    const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

    if (
      !window.confirm(
        `Delete ${name}? Its chats and diagnoses will be deleted too.`
      )
    ) {
      return;
    }

    await deleteVehicle(vehicle.id);
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Your vehicles</h1>
            <p>E-Kaniko uses the vehicle you select to tailor its questions.</p>
          </div>

          {!isAdding && !editingVehicle && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setMode("add")}
            >
              Add vehicle
            </button>
          )}
        </div>

        {loading && <p>Loading vehicles...</p>}

        {isAdding && (
          <VehicleForm
            title={
              vehicles.length === 0 ? "Add your first vehicle" : "Add a vehicle"
            }
            submitLabel="Save vehicle"
            onCancel={vehicles.length > 0 ? () => setMode(null) : undefined}
            onSubmit={async (payload) => {
              const result = await addVehicle(payload);
              if (!result.error) setMode(null);
              return result;
            }}
          />
        )}

        {editingVehicle && (
          <VehicleForm
            key={editingVehicle.id}
            vehicle={editingVehicle}
            title="Edit vehicle"
            submitLabel="Save changes"
            onCancel={() => setMode(null)}
            onSubmit={async (payload) => {
              const result = await updateVehicle(editingVehicle.id, payload);
              if (!result.error) setMode(null);
              return result;
            }}
          />
        )}

        <div className="vehicle-list">
          {vehicles.map((vehicle) => {
            const isSelected = vehicle.id === selectedVehicle?.id;

            const details = [
              vehicle.engine,
              vehicle.mileage != null &&
                `${vehicle.mileage.toLocaleString()} km`,
              vehicle.transmission_type,
              vehicle.plate_number,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <div
                key={vehicle.id}
                className={`vehicle-row ${isSelected ? "is-selected" : ""}`}
              >
                <div>
                  <h3>
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  {details && <p>{details}</p>}
                </div>

                <div className="vehicle-row-actions">
                  {isSelected ? (
                    <span className="in-use-tag">In use</span>
                  ) : (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => selectVehicle(vehicle.id)}
                    >
                      Use this vehicle
                    </button>
                  )}

                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setMode(vehicle.id)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => handleDelete(vehicle)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export default Vehicles;
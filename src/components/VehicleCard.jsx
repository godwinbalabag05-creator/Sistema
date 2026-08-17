function VehicleCard({ vehicle }) {
  return (
    <div className="vehicle-card">
      <span className="vehicle-label">MY VEHICLE</span>

      <h2>
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h2>

      <p>{vehicle.engine}</p>

      <button type="button">
        Change Vehicle
      </button>
    </div>
  );
}

export default VehicleCard;
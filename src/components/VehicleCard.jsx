import { Link } from "react-router-dom";

function VehicleCard({ vehicle }) {
  const details = [
    vehicle.engine,
    vehicle.mileage != null && `${vehicle.mileage.toLocaleString()} km`,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="vehicle-card">
      <span className="vehicle-label">MY VEHICLE</span>

      <h2>
        {vehicle.year} {vehicle.make} {vehicle.model}
      </h2>

      {details && <p>{details}</p>}

      <Link to="/vehicles" className="vehicle-card-link">
        Change vehicle
      </Link>
    </div>
  );
}

export default VehicleCard;
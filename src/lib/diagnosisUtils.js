export function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

export function vehicleName(row) {
  const vehicle = row.conversations?.vehicles;

  return vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Vehicle";
}
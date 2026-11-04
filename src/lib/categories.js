export const CATEGORIES = [
  { value: "brakes", label: "Brakes" },
  { value: "engine", label: "Engine" },
  { value: "electrical", label: "Electrical" },
  { value: "transmission", label: "Transmission" },
  { value: "suspension", label: "Suspension and steering" },
  { value: "cooling", label: "Cooling system" },
  { value: "tires", label: "Tires and wheels" },
  { value: "aircon", label: "Aircon" },
  { value: "exhaust", label: "Exhaust" },
  { value: "general", label: "General repair" },
];

export function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}
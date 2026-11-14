export function hasPin(booking) {
  return booking?.service_lat != null && booking?.service_lng != null;
}

export function pinPreviewLink(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// The exact pin when there is one, otherwise a search for the typed address
export function bookingMapLink(booking) {
  if (hasPin(booking)) {
    return pinPreviewLink(booking.service_lat, booking.service_lng);
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking?.service_address ?? "")}`;
}

export function mapLabel(booking) {
  if (!hasPin(booking)) return "Open in Maps";

  return booking.location_accuracy != null
    ? `Open exact pin in Maps (about ${booking.location_accuracy} m)`
    : "Open exact pin in Maps";
}
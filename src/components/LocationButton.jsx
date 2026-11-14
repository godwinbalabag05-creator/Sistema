import { useState } from "react";

import { pinPreviewLink } from "../lib/location";

function errorMessage(error) {
  switch (error?.code) {
    case 1:
      return "Location access was blocked. Allow it for this site in your browser settings, or just type your address above.";
    case 2:
      return "Your device couldn't work out where you are. Try again outdoors, or type your address.";
    case 3:
      return "Finding your location took too long. Try again, or type your address.";
    default:
      return "Your location couldn't be read. You can type your address instead.";
  }
}

function LocationButton({ value, onChange, disabled }) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");

  const supported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  function locate() {
    setError("");

    if (!supported) {
      setError("This browser can't share your location. Type your address instead.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onChange({
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy),
        });
      },
      (err) => {
        setLocating(false);
        setError(errorMessage(err));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  return (
    <div className="location-box">
      <span className="location-label">Exact location (optional)</span>

      {value ? (
        <div className="location-result">
          <p>
            Pin saved, accurate to about {value.accuracy} m.
            {value.accuracy > 200 &&
              " That's rough, so check the pin before you send."}
          </p>

          <div className="location-actions">
            <a
              className="text-button"
              href={pinPreviewLink(value.lat, value.lng)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Check the pin in Maps
            </a>

            <button
              type="button"
              className="text-button"
              onClick={locate}
              disabled={disabled || locating}
            >
              {locating ? "Finding you..." : "Update"}
            </button>

            <button
              type="button"
              className="text-button danger"
              onClick={() => onChange(null)}
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="secondary-button"
          onClick={locate}
          disabled={disabled || locating}
        >
          {locating ? "Finding you..." : "Use my current location"}
        </button>
      )}

      <p className="location-hint">
        This shares an exact map pin with the shop, along with your address. It
        is used only for this booking and is never kept on your profile.
      </p>

      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

export default LocationButton;
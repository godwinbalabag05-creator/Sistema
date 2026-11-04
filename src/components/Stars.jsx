import { useState } from "react";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

function StarIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="currentColor"
      />
    </svg>
  );
}

// Read-only stars. Supports decimals, like 4.5
export function StarRating({ value = 0, size = 18 }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const row = [1, 2, 3, 4, 5].map((n) => <StarIcon key={n} size={size} />);

  return (
    <span
      className="stars"
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      <span className="stars-row stars-empty">{row}</span>
      <span
        className="stars-row stars-fill"
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        {row}
      </span>
    </span>
  );
}

// Clickable stars with hover preview and keyboard support
export function StarInput({ value, onChange, name }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div
      className="star-input"
      role="radiogroup"
      aria-label="Rating"
      onMouseLeave={() => setHover(0)}
    >
      <div className="star-input-row">
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            className={n <= shown ? "on" : ""}
            onMouseEnter={() => setHover(n)}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
            />
            <StarIcon size={34} />
            <span className="sr-only">{n} out of 5</span>
          </label>
        ))}
      </div>

      <span className="star-caption">
        {shown ? LABELS[shown] : "Select a rating"}
      </span>
    </div>
  );
}
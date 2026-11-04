const STREAKS = [
  { top: "12%", "--w": "46%", animationDuration: "6.5s", animationDelay: "0s" },
  { top: "24%", "--w": "30%", animationDuration: "8s", animationDelay: "2.2s" },
  { top: "36%", "--w": "52%", animationDuration: "7s", animationDelay: "4.1s" },
  { top: "48%", "--w": "34%", animationDuration: "9s", animationDelay: "1.3s" },
  { top: "58%", "--w": "44%", animationDuration: "6s", animationDelay: "5.4s" },
];

// Light layer that runs behind the whole panel
export function AdBackdrop() {
  return (
    <div className="ad-backdrop" aria-hidden="true">
      <div className="ad-glow" />

      {STREAKS.map((style, index) => (
        <span key={index} className="ad-streak" style={style} />
      ))}
    </div>
  );
}

// The four-scene loop. Each scene owns a 5 second slot of a 20 second cycle.
export function AdScenes() {
  return (
    <div className="ad-scenes" aria-hidden="true">

      {/* Scene 1: logo intro */}
      <div className="ad-scene scene-1" style={{ "--d": "0s" }}>
        <div className="ad-graphic ad-logo">
          <span className="ad-flash" />
          <span className="ad-plate">E-Kaniko</span>
        </div>
        <p className="ad-caption">Car trouble, decoded.</p>
      </div>

      {/* Scene 2: diagnostic scan */}
      <div className="ad-scene scene-2" style={{ "--d": "5s" }}>
        <div className="ad-graphic ad-car">
          <svg viewBox="0 0 400 150" className="ad-car-svg">
            <path
              className="car-body"
              d="M20 108 C20 97 30 91 56 87 L100 81 C116 62 138 50 168 48 L238 48 C268 50 292 65 312 83 L356 89 C372 93 380 99 380 109 L380 118 L20 118 Z"
            />
            <path
              className="car-glass"
              d="M122 81 C134 66 150 57 170 56 L204 56 L204 81 Z M214 56 L238 56 C256 58 272 69 286 81 L214 81 Z"
            />
            <ellipse className="car-light" cx="374" cy="101" rx="5" ry="3" />
            <rect x="20" y="98" width="5" height="8" fill="#c62f2f" />

            <circle className="car-tire" cx="95" cy="118" r="22" />
            <circle className="car-hub" cx="95" cy="118" r="11" />
            <circle cx="95" cy="118" r="4" fill="#aab4c6" />

            <circle className="car-tire" cx="305" cy="118" r="22" />
            <circle className="car-hub" cx="305" cy="118" r="11" />
            <circle cx="305" cy="118" r="4" fill="#aab4c6" />
          </svg>

          <span className="ad-ground" />
          <span className="ad-scanline" />

          <span className="ad-mark m1 up">
            <i />
            <b>Engine: normal</b>
          </span>
          <span className="ad-mark m2 down">
            <i />
            <b>Brake pads: worn</b>
          </span>
          <span className="ad-mark m3 down">
            <i />
            <b>Tires: check</b>
          </span>
        </div>
        <p className="ad-caption">Describe it. We scan it.</p>
      </div>

      {/* Scene 3: urgency gauge */}
      <div className="ad-scene scene-3" style={{ "--d": "10s" }}>
        <div className="ad-graphic ad-gauge">
          <svg viewBox="0 0 240 150">
            <path className="gauge-arc" stroke="#1f9d63" d="M30 130 A90 90 0 0 1 75 52.06" />
            <path className="gauge-arc" stroke="#e08a00" d="M75 52.06 A90 90 0 0 1 165 52.06" />
            <path className="gauge-arc" stroke="#c62f2f" d="M165 52.06 A90 90 0 0 1 210 130" />

            <line className="gauge-needle" x1="120" y1="130" x2="120" y2="58" />
            <circle cx="120" cy="130" r="9" fill="#f7c600" />

            <g className="gauge-lamp" transform="translate(200 4)">
              <path d="M11 0 L22 20 H0 Z" fill="#e08a00" />
              <rect x="10" y="7" width="2" height="7" fill="#121c33" />
              <circle cx="11" cy="16.5" r="1.2" fill="#121c33" />
            </g>
          </svg>
        </div>
        <p className="ad-caption">Know how urgent it is.</p>
      </div>

      {/* Scene 4: book a shop */}
      <div className="ad-scene scene-4" style={{ "--d": "15s" }}>
        <div className="ad-graphic ad-map">
          <svg viewBox="0 0 300 160">
            <path
              className="map-streets"
              d="M0 40 H300 M0 100 H300 M80 0 V160 M200 0 V160"
            />
            <path
              className="route-base"
              d="M30 128 C90 128 92 56 152 74 S232 112 270 40"
            />
            <path
              className="route"
              pathLength="100"
              d="M30 128 C90 128 92 56 152 74 S232 112 270 40"
            />

            <circle cx="30" cy="128" r="6" fill="#ffffff" />

            <g className="map-pin">
              <circle className="map-ring" cx="270" cy="40" r="9" />
              <circle cx="270" cy="40" r="9" fill="#f7c600" />
              <circle cx="270" cy="40" r="3.5" fill="#121c33" />
            </g>
          </svg>
        </div>
        <p className="ad-caption">Then book a verified mechanic.</p>
      </div>

    </div>
  );
}
import { useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";

function Diagnosis() {
  const [symptoms, setSymptoms] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(false);

  function handleDiagnosis() {
    if (!symptoms.trim()) return;

    setIsAnalyzing(true);

    // Temporary simulation
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult(true);
    }, 1500);
  }

  return (
    <>
      <Navbar />

      <main className="page diagnosis-page">

        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>

        {/* Intro */}
        <section className="diagnosis-intro">

          <span className="eyebrow">
            AI DIAGNOSIS
          </span>

          <h1>
            What's happening with your vehicle?
          </h1>

          <p>
            Tell E-Kaniko what you're experiencing.
            Include sounds, warning lights, smells,
            performance issues, or anything unusual
            you've noticed.
          </p>

        </section>

        {/* Form */}
        <section className="diagnosis-form">

          <label htmlFor="symptoms">
            Describe the problem
          </label>

          <textarea
            id="symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Example: My car makes a clicking sound when I turn left and the steering feels heavier than usual..."
            rows={7}
          />

          <div className="form-hint">
            💡 The more details you provide,
            the better the diagnosis.
          </div>

          <button
            type="button"
            className="primary-button diagnose-button"
            onClick={handleDiagnosis}
            disabled={isAnalyzing || !symptoms.trim()}
          >
            {isAnalyzing
              ? "Analyzing..."
              : "Analyze Vehicle"}
          </button>

        </section>

        {/* AI Result */}
        {result && (
          <section className="diagnosis-result">

            <div className="result-header">

              <div>
                <span className="eyebrow">
                  AI ANALYSIS
                </span>

                <h2>
                  Possible brake system issue
                </h2>
              </div>

              <span className="severity medium">
                Medium
              </span>

            </div>

            <p>
              Based on the symptoms you described,
              the issue may be related to your brake
              pads or brake components.
            </p>

            <div className="result-grid">

              <div>
                <h3>Possible Causes</h3>

                <ul>
                  <li>Worn brake pads</li>
                  <li>Debris around the brake assembly</li>
                  <li>Brake rotor surface irregularities</li>
                </ul>
              </div>

              <div>
                <h3>Recommended Action</h3>

                <p>
                  Have the brake system inspected by
                  a qualified mechanic before continuing
                  to drive if the noise becomes severe.
                </p>
              </div>

            </div>

            {/* Mechanic CTA */}
            <div className="mechanic-action">

              <div>
                <strong>
                  Need professional help?
                </strong>

                <p>
                  Find mechanics near your location.
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
              >
                Find a Mechanic
              </button>

            </div>

          </section>
        )}

      </main>
    </>
  );
}

export default Diagnosis;
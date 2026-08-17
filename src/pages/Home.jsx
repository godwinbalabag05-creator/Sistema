import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import VehicleCard from "../components/VehicleCard";
import DiagnosisCard from "../components/DiagnosisCard";

function Home() {
  const vehicle = {
    year: 2018,
    make: "Toyota",
    model: "Vios",
    engine: "1.3L Gasoline",
  };

  return (
    <>
      <Navbar />

      <main className="page">

        {/* Hero */}
        <section className="hero-section">
          <div>
            <span className="eyebrow">
              AI-POWERED AUTOMOTIVE ASSISTANT
            </span>

            <h1>
              Diagnose your car
              <br />
              with <span>E-Kaniko.</span>
            </h1>

            <p>
              Describe what's happening with your vehicle and
              let E-Kaniko help you understand the possible
              problem, what to check, and what to do next.
            </p>

            <div className="hero-actions">
              <Link
                to="/diagnosis"
                className="primary-button"
              >
                Start Diagnosis
              </Link>

              <button
                type="button"
                className="secondary-button"
              >
                Find a Mechanic
              </button>
            </div>
          </div>

          <div className="hero-placeholder">
            <div className="car-icon">🚗</div>
            <p>AI Automotive Assistant</p>
          </div>
        </section>

        {/* Dashboard */}
        <section className="dashboard-section">

          <VehicleCard vehicle={vehicle} />

          <div className="diagnosis-list">

            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  RECENT
                </span>

                <h2>Previous Diagnoses</h2>
              </div>

              <Link to="/diagnosis">
                New Diagnosis →
              </Link>
            </div>

            <DiagnosisCard
              title="Engine overheating"
              description="Possible cooling system issue. Check coolant level and radiator condition."
              severity="high"
            />

            <DiagnosisCard
              title="Brake noise"
              description="The symptoms may indicate worn brake pads or debris around the brake assembly."
              severity="medium"
            />

          </div>

        </section>

      </main>
    </>
  );
}

export default Home;
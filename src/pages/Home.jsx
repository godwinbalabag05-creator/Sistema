import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import VehicleCard from "../components/VehicleCard";
import DiagnosisCard from "../components/DiagnosisCard";
import { useVehicles } from "../lib/VehicleContext";

function Home() {
  const { selectedVehicle, loading } = useVehicles();

  return (
    <>
      <Navbar />

      <main className="page">

        {/* Hero */}
        <section className="hero-section">
          <div>
            <h1>
              Know what's wrong with your car before you reach the shop.
            </h1>

            <p>
              Describe the noise, smell or warning light. E-Kaniko asks
              the follow-up questions a mechanic would, then tells you
              how urgent it is and whether it's safe to keep driving.
            </p>

            <div className="hero-actions">
              <Link
                to="/diagnosis"
                className="primary-button"
              >
                Start a diagnosis
              </Link>

              <Link to="/shops" className="secondary-button">
                Find a mechanic
              </Link>
            </div>
          </div>

          <aside className="job-card" aria-label="Sample diagnosis">
            <header className="job-card-head">
              <strong>Diagnosis report</strong>
              <span>Sample</span>
            </header>

            <dl className="job-fields">
              <div>
                <dt>Vehicle</dt>
                <dd>2018 Toyota Vios, 42,300 km</dd>
              </div>

              <div>
                <dt>Symptom</dt>
                <dd>Squealing noise whenever I brake</dd>
              </div>

              <div>
                <dt>Likely cause</dt>
                <dd>Worn brake pads</dd>
              </div>

              <div>
                <dt>Urgency</dt>
                <dd>
                  <span className="severity medium">Medium</span>
                </dd>
              </div>

              <div>
                <dt>Drive advice</dt>
                <dd>Drive carefully to a shop within 1 to 2 weeks</dd>
              </div>
            </dl>
          </aside>
        </section>

        {/* Dashboard */}
        <section className="dashboard-section">

          <div>
            {loading ? (
              <p>Loading your vehicle...</p>
            ) : selectedVehicle ? (
              <VehicleCard vehicle={selectedVehicle} />
            ) : (
              <div className="empty-state">
                <h2>No vehicle yet</h2>
                <p>
                  Add your car so E-Kaniko can ask questions that fit it.
                </p>
                <Link to="/vehicles" className="primary-button">
                  Add your first vehicle
                </Link>
              </div>
            )}
          </div>

          <div className="diagnosis-list">

            <div className="section-heading">
              <h2>Previous Diagnoses</h2>

              <Link to="/diagnosis">
                New diagnosis
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
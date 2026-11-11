import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import VehicleCard from "../components/VehicleCard";
import DiagnosisCard from "../components/DiagnosisCard";
import ListSkeleton from "../components/ListSkeleton";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useVehicles } from "../lib/VehicleContext";

const ADVICE = {
  drive_normally: "Safe to keep driving normally.",
  drive_carefully: "Drive carefully and get it checked soon.",
  do_not_drive: "Do not drive. Arrange a tow or roadside help.",
};

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

function vehicleName(row) {
  const vehicle = row.conversations?.vehicles;
  return vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : "Vehicle";
}

function Home() {
  const { user } = useAuth();
  const { selectedVehicle, loading } = useVehicles();
  const userId = user?.id;

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  // Your own saved diagnoses, newest first
  useEffect(() => {
    if (!supabase || !userId) {
      setHistoryLoading(false);
      return undefined;
    }

    let ignore = false;

    supabase
      .from("diagnoses")
      .select(
        "*, conversations!inner(owner_id, vehicle_id, vehicles(year, make, model))"
      )
      .eq("conversations.owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (ignore) return;
        setHistory(data ?? []);
        setHistoryLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [userId]);

  function openDetails(row) {
    setSelected(row);
    setOpen(true);
  }

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

            {historyLoading && <ListSkeleton rows={2} />}

            {!historyLoading && history.length === 0 && (
              <div className="empty-state">
                <h2>No diagnoses yet</h2>
                <p>
                  Describe a problem with your car, and the result is saved
                  here so you can come back to it.
                </p>
                <Link to="/diagnosis" className="primary-button">
                  Start your first diagnosis
                </Link>
              </div>
            )}

            {history.map((row) => (
              <DiagnosisCard
                key={row.id}
                title={row.title}
                description={row.summary}
                severity={row.severity}
                meta={`${vehicleName(row)}, ${formatDate(row.created_at)}`}
                onOpen={() => openDetails(row)}
              />
            ))}

          </div>

        </section>

      </main>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={selected?.title ?? "Diagnosis"}
        size="md"
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setOpen(false)}
            >
              Close
            </button>

            {selected && (
              <Link
                to={`/shops?category=${selected.service_category ?? ""}`}
                className="primary-button"
                onClick={() => setOpen(false)}
              >
                Find a mechanic
              </Link>
            )}
          </>
        }
      >
        {selected && (
          <div className="diagnosis-detail">
            <div className="diagnosis-detail-top">
              <span className={`severity ${selected.severity}`}>
                {selected.severity}
              </span>
              <span className="diagnosis-meta">
                {vehicleName(selected)}, {formatDate(selected.created_at)}
              </span>
            </div>

            <p className="modal-text">{selected.summary}</p>

            {selected.driving_advice && (
              <div className={`driving-advice ${selected.driving_advice}`}>
                {ADVICE[selected.driving_advice]}
              </div>
            )}

            <h3>Possible causes</h3>
            <ul>
              {(selected.causes ?? []).map((cause) => (
                <li key={cause}>{cause}</li>
              ))}
            </ul>

            <h3>Recommended action</h3>
            <p className="modal-text">{selected.recommended_action}</p>

            <p className="diagnosis-disclaimer">{selected.disclaimer}</p>
          </div>
        )}
      </Modal>
    </>
  );
}

export default Home;
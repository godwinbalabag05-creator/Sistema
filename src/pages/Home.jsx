import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import VehicleCard from "../components/VehicleCard";
import DiagnosisCard from "../components/DiagnosisCard";
import DiagnosisDetailModal from "../components/DiagnosisDetailModal";
import ListSkeleton from "../components/ListSkeleton";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useVehicles } from "../lib/VehicleContext";
import { formatDate, vehicleName } from "../lib/diagnosisUtils";

const LATEST = 3;

function Home() {
  const { user } = useAuth();
  const { selectedVehicle, loading } = useVehicles();
  const userId = user?.id;

  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  // Your latest saved diagnoses, newest first
  useEffect(() => {
    if (!supabase || !userId) {
      setHistoryLoading(false);
      return undefined;
    }

    let ignore = false;

    supabase
      .from("diagnoses")
      .select(
        "*, conversations!inner(owner_id, vehicle_id, vehicles(year, make, model))",
        { count: "exact" }
      )
      .eq("conversations.owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(LATEST)
      .then(({ data, count }) => {
        if (ignore) return;
        setHistory(data ?? []);
        setTotal(count ?? 0);
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

              {total > 0 && (
                <Link to="/history">View history ({total})</Link>
              )}
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

            {total > LATEST && (
              <p className="history-more">
                Showing your latest {LATEST} of {total}.{" "}
                <Link to="/history">See all of them</Link>
              </p>
            )}

          </div>

        </section>

      </main>

      <DiagnosisDetailModal
        open={open}
        onClose={() => setOpen(false)}
        diagnosis={selected}
      />
    </>
  );
}

export default Home;
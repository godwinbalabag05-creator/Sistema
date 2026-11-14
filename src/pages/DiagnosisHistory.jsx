import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import DiagnosisCard from "../components/DiagnosisCard";
import DiagnosisDetailModal from "../components/DiagnosisDetailModal";
import ListSkeleton from "../components/ListSkeleton";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useVehicles } from "../lib/VehicleContext";
import { formatDate, vehicleName } from "../lib/diagnosisUtils";

const PAGE_SIZE = 10;

const SELECT =
  "*, conversations!inner(owner_id, vehicle_id, vehicles(year, make, model))";

function DiagnosisHistory() {
  const { user } = useAuth();
  const { vehicles } = useVehicles();
  const userId = user?.id;

  const [term, setTerm] = useState("");
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  // Wait until the person stops typing before searching
  useEffect(() => {
    const timer = setTimeout(() => setSearch(term.trim()), 300);
    return () => clearTimeout(timer);
  }, [term]);

  const fetchPage = useCallback(
    async (from) => {
      let query = supabase
        .from("diagnoses")
        .select(SELECT, { count: "exact" })
        .eq("conversations.owner_id", userId)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (severity) query = query.eq("severity", severity);
      if (vehicleId) query = query.eq("conversations.vehicle_id", vehicleId);

      if (search) {
        const safe = search.replace(/[,%()*]/g, " ").trim();

        if (safe) {
          query = query.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%`);
        }
      }

      return query;
    },
    [userId, severity, vehicleId, search]
  );

  // First page, and again whenever a filter changes
  useEffect(() => {
    if (!supabase || !userId) return undefined;

    let ignore = false;

    setLoading(true);
    setError("");

    fetchPage(0).then(({ data, error: loadError, count }) => {
      if (ignore) return;
      if (loadError) setError(loadError.message);
      setRows(data ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [fetchPage, userId]);

  async function loadMore() {
    setLoadingMore(true);

    const { data, error: loadError } = await fetchPage(rows.length);

    setLoadingMore(false);

    if (loadError) {
      setError(loadError.message);
      return;
    }

    setRows((current) => [...current, ...(data ?? [])]);
  }

  function clearFilters() {
    setTerm("");
    setSearch("");
    setSeverity("");
    setVehicleId("");
  }

  function openDetails(row) {
    setSelected(row);
    setOpen(true);
  }

  const filtering = Boolean(search || severity || vehicleId);

  return (
    <>
      <Navbar />

      <main className="page">
        <Link to="/" className="back-link">
          ← Back to Dashboard
        </Link>

        <div className="page-head history-head">
          <div>
            <h1>Diagnosis history</h1>
            <p>Every diagnosis E-Kaniko has saved for you, newest first.</p>
          </div>

          <Link to="/diagnosis" className="primary-button">
            New diagnosis
          </Link>
        </div>

        <div className="filters">
          <div>
            <label htmlFor="history-search">Search</label>
            <input
              id="history-search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Brakes, overheating, noise..."
            />
          </div>

          <div>
            <label htmlFor="history-severity">Urgency</label>
            <select
              id="history-severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="">All</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label htmlFor="history-vehicle">Vehicle</label>
            <select
              id="history-vehicle"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="">All vehicles</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>

          {filtering && (
            <button
              type="button"
              className="text-button filters-clear"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading && <ListSkeleton />}

        {!loading && total === 0 && (
          <div className="empty-state">
            <h2>{filtering ? "No diagnoses match" : "No diagnoses yet"}</h2>
            <p>
              {filtering
                ? "Try a different search, urgency or vehicle."
                : "Describe a problem with your car, and the result is saved here."}
            </p>

            {!filtering && (
              <Link to="/diagnosis" className="primary-button">
                Start your first diagnosis
              </Link>
            )}
          </div>
        )}

        {!loading && rows.length > 0 && (
          <>
            <p className="table-count">
              Showing {rows.length} of {total} diagnos
              {total === 1 ? "is" : "es"}
            </p>

            <div className="history-list">
              {rows.map((row) => (
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

            {rows.length < total && (
              <button
                type="button"
                className="secondary-button load-more"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load more"}
              </button>
            )}
          </>
        )}
      </main>

      <DiagnosisDetailModal
        open={open}
        onClose={() => setOpen(false)}
        diagnosis={selected}
      />
    </>
  );
}

export default DiagnosisHistory;
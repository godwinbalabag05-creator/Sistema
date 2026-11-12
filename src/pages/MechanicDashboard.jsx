import { useCallback, useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import ListSkeleton from "../components/ListSkeleton";
import Modal from "../components/Modal";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { formatPhone } from "../lib/phone";
import { statusLabel } from "../lib/bookingStatus";
import DiagnosisBox from "../components/DiagnosisBox";


const TABS = [
  { key: "new", label: "New requests", statuses: ["forwarded"] },
  { key: "active", label: "Active jobs", statuses: ["confirmed", "in_progress"] },
  { key: "review", label: "Waiting for admin", statuses: ["awaiting_review"] },
  { key: "history", label: "History", statuses: ["completed", "declined", "cancelled"] },
];

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function MechanicDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const [shops, setShops] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("new");
  const [busyId, setBusyId] = useState(null);

  const [dialog, setDialog] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [text, setText] = useState("");
  const [dialogError, setDialogError] = useState("");

  const load = useCallback(async () => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    const [shopRes, bookingRes] = await Promise.all([
      supabase
        .from("mechanic_shops")
        .select("id, shop_name, address, city")
        .eq("mechanic_id", userId),
      supabase
        .from("bookings")
        .select(
          "*, mechanic_shops(shop_name), vehicles(year, make, model, engine, plate_number), diagnoses(title, summary, severity, causes, recommended_action, driving_advice)"        )
        .order("requested_datetime", { ascending: true }),
    ]);

    const failure = shopRes.error ?? bookingRes.error;
    setError(failure ? failure.message : "");
    setShops(shopRes.data ?? []);
    setBookings(bookingRes.data ?? []);
    setLoading(false);
  }, [userId]);

  // Load now, then check for new requests every 30 seconds
  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  // Returns an error message, or "" when it worked
  async function change(booking, values) {
    setBusyId(booking.id);

    const { data, error: updateError } = await supabase
      .from("bookings")
      .update(values)
      .eq("id", booking.id)
      .select("id");

    setBusyId(null);

    if (updateError) return updateError.message;

    if (!data || data.length === 0) {
      return "That change was not saved. You may not have permission.";
    }

    await load();
    return "";
  }

  async function quickChange(booking, values) {
    setError("");
    const message = await change(booking, values);
    if (message) setError(message);
  }

  function openDialog(type, booking) {
    setDialog({ type, booking });
    setText("");
    setDialogError("");
    setDialogOpen(true);
  }

  async function submitDialog(e) {
    e.preventDefault();

    const value = text.trim();

    if (dialog.type === "decline" && value.length < 5) {
      setDialogError("Tell the admin why you are declining.");
      return;
    }

    if (dialog.type === "report" && value.length < 10) {
      setDialogError("Write a short report for the admin (at least 10 characters).");
      return;
    }

    setDialogError("");

    const values =
      dialog.type === "decline"
        ? { status: "declined", decline_reason: value }
        : { status: "awaiting_review", completion_report: value };

    const message = await change(dialog.booking, values);

    if (message) {
      setDialogError(message);
      return;
    }

    setDialogOpen(false);
  }

  const counts = Object.fromEntries(
    TABS.map((item) => [
      item.key,
      bookings.filter((b) => item.statuses.includes(b.status)).length,
    ])
  );

  const current = TABS.find((item) => item.key === tab) ?? TABS[0];
  const visible = bookings.filter((b) => current.statuses.includes(b.status));
  const doneCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Mechanic dashboard</h1>
            <p>
              {shops.length > 0
                ? `Booking requests for ${shops.map((shop) => shop.shop_name).join(", ")}.`
                : "Booking requests sent to your shop by the admin."}
            </p>
          </div>

          <button type="button" className="secondary-button" onClick={load}>
            Refresh
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading && <ListSkeleton />}

        {!loading && shops.length === 0 && (
          <div className="empty-state">
            <h2>No shop assigned yet</h2>
            <p>
              Ask the admin to assign your account to a shop. Booking requests
              will show up here once they do.
            </p>
          </div>
        )}

        {!loading && shops.length > 0 && (
          <>
            <div className="stat-grid">
              <div className={`stat-card ${counts.new > 0 ? "attention" : ""}`}>
                <span className="stat-label">New requests</span>
                <strong className="stat-value">{counts.new}</strong>
                <span className="stat-note">Waiting for you to accept or decline</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Active jobs</span>
                <strong className="stat-value">{counts.active}</strong>
                <span className="stat-note">Accepted or in progress</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Waiting for admin</span>
                <strong className="stat-value">{counts.review}</strong>
                <span className="stat-note">Reported finished</span>
              </div>

              <div className="stat-card">
                <span className="stat-label">Completed</span>
                <strong className="stat-value">{doneCount}</strong>
                <span className="stat-note">Confirmed by the admin</span>
              </div>
            </div>

            <div className="mail-tabs">
              {TABS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className="mail-tab"
                  aria-pressed={tab === item.key}
                  onClick={() => setTab(item.key)}
                >
                  {item.label} ({counts[item.key]})
                </button>
              ))}
            </div>

            {visible.length === 0 && (
              <div className="empty-state">
                <h2>Nothing here</h2>
                <p>Requests in this stage will appear automatically.</p>
              </div>
            )}

            <div className="shop-list">
              {visible.map((booking) => {
                const vehicle = booking.vehicles;
                const busy = busyId === booking.id;

                return (
                  <article key={booking.id} className="shop-card">
                    <div className="shop-card-top">
                      <div>
                        <h3>{formatDate(booking.requested_datetime)}</h3>
                        <p>{booking.mechanic_shops?.shop_name}</p>
                      </div>

                      <span className={`status-chip ${booking.status}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="customer-box">
                      <h4>Customer</h4>

                      <dl>
                        <div>
                          <dt>Name</dt>
                          <dd>{booking.customer_name || "Not provided"}</dd>
                        </div>

                        <div>
                          <dt>Phone</dt>
                          <dd>
                            {booking.customer_phone ? (
                              <a href={`tel:${booking.customer_phone}`}>
                                {formatPhone(booking.customer_phone)}
                              </a>
                            ) : (
                              "Not provided"
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt>Location</dt>
                          <dd>
                            {booking.service_address ? (
                              <>
                                {booking.service_address}
                                <a
                                  className="map-link"
                                  href={mapsLink(booking.service_address)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Open in Maps
                                </a>
                              </>
                            ) : (
                              "Not provided"
                            )}
                          </dd>
                        </div>

                        <div>
                          <dt>Vehicle</dt>
                          <dd>
                            {vehicle
                              ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.engine ? `, ${vehicle.engine}` : ""}${vehicle.plate_number ? `, plate ${vehicle.plate_number}` : ""}`
                              : "Not provided"}
                          </dd>
                        </div>

                        <div>
                          <dt>Problem</dt>
                          <dd>{booking.job_brief || "Not provided"}</dd>
                        </div>

                        <div>
                          <dt>Scheduled</dt>
                          <dd>{formatDate(booking.requested_datetime)}</dd>
                        </div>
                      </dl>
                    </div>

                    <DiagnosisBox diagnosis={booking.diagnoses} />

                    {booking.completion_report && (
                      <div className="report-box">
                        <h4>Your report to the admin</h4>
                        <p>{booking.completion_report}</p>
                        {booking.report_submitted_at && (
                          <span className="report-meta">
                            Sent {formatDate(booking.report_submitted_at)}
                          </span>
                        )}
                      </div>
                    )}

                    {booking.status === "declined" && booking.decline_reason && (
                      <div className="report-box warn">
                        <h4>Reason you gave</h4>
                        <p>{booking.decline_reason}</p>
                      </div>
                    )}

                    {booking.status === "awaiting_review" && (
                      <p className="booking-vehicle">
                        Waiting for the admin to confirm that the job is complete.
                      </p>
                    )}

                    {booking.status === "completed" && (
                      <p className="booking-vehicle">
                        The admin confirmed this job as completed.
                      </p>
                    )}

                    <div className="shop-card-links">
                      {booking.status === "forwarded" && (
                        <>
                          <button
                            type="button"
                            className="primary-button"
                            disabled={busy}
                            onClick={() =>
                              quickChange(booking, { status: "confirmed" })
                            }
                          >
                            Accept
                          </button>

                          <button
                            type="button"
                            className="secondary-button"
                            disabled={busy}
                            onClick={() => openDialog("decline", booking)}
                          >
                            Decline
                          </button>
                        </>
                      )}

                      {booking.status === "confirmed" && (
                        <button
                          type="button"
                          className="secondary-button"
                          disabled={busy}
                          onClick={() =>
                            quickChange(booking, { status: "in_progress" })
                          }
                        >
                          Start work
                        </button>
                      )}

                      {(booking.status === "confirmed" ||
                        booking.status === "in_progress") && (
                        <button
                          type="button"
                          className="primary-button"
                          disabled={busy}
                          onClick={() => openDialog("report", booking)}
                        >
                          Report job finished
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={
          dialog?.type === "decline" ? "Decline this request" : "Report job finished"
        }
        size="sm"
        footer={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </button>

            <button
              type="submit"
              form="mechanic-dialog"
              className={`primary-button ${dialog?.type === "decline" ? "danger-button" : ""}`}
              disabled={Boolean(busyId)}
            >
              {dialog?.type === "decline" ? "Decline request" : "Send to admin"}
            </button>
          </>
        }
      >
        <form id="mechanic-dialog" onSubmit={submitDialog}>
          <p className="modal-text">
            {dialog?.type === "decline"
              ? "The admin will see your reason and can send the request to another shop."
              : "Describe the work you did. The admin reviews it and confirms completion. You can't mark a job complete yourself."}
          </p>

          <label htmlFor="mechanic-text">
            {dialog?.type === "decline" ? "Reason" : "Completion report"}
          </label>

          <textarea
            id="mechanic-text"
            rows={4}
            maxLength={600}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              dialog?.type === "decline"
                ? "Example: Fully booked that day."
                : "Example: Replaced the front brake pads and resurfaced the rotors."
            }
          />

          {dialogError && <p className="form-error">{dialogError}</p>}
        </form>
      </Modal>
    </>
  );
}

export default MechanicDashboard;
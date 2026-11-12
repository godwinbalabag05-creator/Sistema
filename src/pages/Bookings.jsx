import { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import ListSkeleton from "../components/ListSkeleton";
import { StarRating } from "../components/Stars";
import { ReviewForm } from "../components/Reviews";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { confirmDialog } from "../lib/confirm";
import { formatPhone } from "../lib/phone";
import { statusLabel } from "../lib/bookingStatus";
import DiagnosisBox from "../components/DiagnosisBox";


function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function ForwardControl({ booking, shops, busy, onForward }) {
  const choices = shops.filter((shop) => shop.verified);

  const [shopId, setShopId] = useState(
    choices.some((shop) => shop.id === booking.shop_id) ? booking.shop_id : ""
  );

  const selected = choices.find((shop) => shop.id === shopId);
  const original = shops.find((shop) => shop.id === booking.shop_id);
  const ready = Boolean(selected && selected.mechanic_id);

  return (
    <div className="forward-box">
      <label htmlFor={`forward-${booking.id}`}>
        {booking.status === "declined" ? "Forward to another shop" : "Forward to shop"}
      </label>

      <div className="forward-row">
        <select
          id={`forward-${booking.id}`}
          value={shopId}
          onChange={(e) => setShopId(e.target.value)}
        >
          <option value="">Choose a shop</option>
          {choices.map((shop) => (
            <option key={shop.id} value={shop.id} disabled={!shop.mechanic_id}>
              {shop.shop_name}
              {shop.city ? `, ${shop.city}` : ""}
              {!shop.mechanic_id ? " (no mechanic assigned)" : ""}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="primary-button"
          disabled={!ready || busy}
          onClick={() => onForward(booking, shopId)}
        >
          {busy ? "Forwarding..." : "Forward"}
        </button>
      </div>

      {original && shopId && shopId !== booking.shop_id && (
        <p className="forward-note">
          The customer chose {original.shop_name}. You are sending this request
          to a different shop.
        </p>
      )}
    </div>
  );
}

function Bookings() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [bookings, setBookings] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const [bookingRes, shopRes] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "*, mechanic_shops(shop_name, address, city, phone), vehicles(year, make, model), users(full_name, email), shop_reviews(id, rating, comment, created_at, author_name), diagnoses(title, summary, severity, causes, recommended_action, driving_advice)"
        )
        .order("created_at", { ascending: false }),
      isAdmin
        ? supabase
            .from("mechanic_shops")
            .select("id, shop_name, city, verified, mechanic_id")
        : Promise.resolve({ data: [] }),
    ]);

    if (bookingRes.error) setError(bookingRes.error.message);
    setBookings(bookingRes.data ?? []);
    setShops(shopRes.data ?? []);
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  // Mechanics work from their own dashboard
  if (profile?.role === "mechanic") {
    return <Navigate to="/mechanic" replace />;
  }

  async function update(booking, values) {
    setBusyId(booking.id);
    setError("");

    const { error: updateError } = await supabase
      .from("bookings")
      .update(values)
      .eq("id", booking.id);

    setBusyId(null);

    if (updateError) {
      setError(updateError.message);
      return false;
    }

    await load();
    return true;
  }

  async function cancelBooking(booking) {
    const mine = booking.owner_id === user?.id;

    const ok = await confirmDialog({
      title: "Cancel this booking?",
      message: mine
        ? "The shop will be notified. You'd need to send a new request to book again."
        : "The customer will be notified that this booking was cancelled.",
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep booking",
      danger: true,
    });

    if (ok) await update(booking, { status: "cancelled" });
  }

  async function confirmCompletion(booking) {
    const ok = await confirmDialog({
      title: "Confirm completion?",
      message:
        "You've reviewed the mechanic's report. The customer will be notified that the service is complete and can leave a review.",
      confirmLabel: "Confirm completion",
    });

    if (ok) await update(booking, { status: "completed" });
  }

  function forwardBooking(booking, shopId) {
    return update(booking, { status: "forwarded", shop_id: shopId });
  }

  function handleReviewed(booking, review) {
    setBookings((current) =>
      current.map((b) =>
        b.id === booking.id ? { ...b, shop_reviews: review } : b
      )
    );
    setReviewingId(null);
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>{isAdmin ? "All bookings" : "Your bookings"}</h1>
            <p>
              {isAdmin
                ? "Review new requests, forward them to a shop, and confirm finished jobs."
                : "Requests you sent to repair shops, and their status."}
            </p>
          </div>

          {!isAdmin && (
            <Link to="/shops" className="primary-button">
              Find a mechanic
            </Link>
          )}
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading && <ListSkeleton />}

        {!loading && bookings.length === 0 && (
          <div className="empty-state">
            <h2>No bookings yet</h2>
            <p>Pick a shop and send a request to see it here.</p>
          </div>
        )}

        <div className="shop-list">
          {bookings.map((booking) => {
            const shop = booking.mechanic_shops;
            const vehicle = booking.vehicles;
            const busy = busyId === booking.id;

            const isMine = booking.owner_id === user?.id;
            const review = Array.isArray(booking.shop_reviews)
              ? booking.shop_reviews[0]
              : booking.shop_reviews;
            const canReview =
              isMine && booking.status === "completed" && !review;

            const canCancel = isAdmin
              ? [
                  "pending",
                  "forwarded",
                  "declined",
                  "confirmed",
                  "in_progress",
                  "awaiting_review",
                ].includes(booking.status)
              : isMine &&
                ["pending", "forwarded", "declined", "confirmed"].includes(
                  booking.status
                );

            const customerName =
              booking.customer_name || booking.users?.full_name || "Not provided";
            const phone = booking.customer_phone;
            const place = booking.service_address;

            return (
              <article key={booking.id} className="shop-card">
                <div className="shop-card-top">
                  <div>
                    <h3>{shop?.shop_name ?? "Shop no longer listed"}</h3>
                    {shop && (
                      <p>
                        {[shop.address, shop.city].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>

                  <span className={`status-chip ${booking.status}`}>
                    {statusLabel(booking.status, !isAdmin)}
                  </span>
                </div>

                <div className="customer-box">
                  <h4>{isMine ? "Details sent to the shop" : "Customer"}</h4>

                  <dl>
                    <div>
                      <dt>Name</dt>
                      <dd>{customerName}</dd>
                    </div>

                    <div>
                      <dt>Phone</dt>
                      <dd>
                        {phone ? (
                          <a href={`tel:${phone}`}>{formatPhone(phone)}</a>
                        ) : (
                          "Not provided"
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>Location</dt>
                      <dd>
                        {place ? (
                          <>
                            {place}
                            <a
                              className="map-link"
                              href={mapsLink(place)}
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
                          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                          : "Not provided"}
                      </dd>
                    </div>

                    <div>
                      <dt>Problem</dt>
                      <dd>{booking.job_brief || "Not provided"}</dd>
                    </div>

                    <div>
                      <dt>Preferred time</dt>
                      <dd>{formatDate(booking.requested_datetime)}</dd>
                    </div>
                  </dl>
                </div>

                <DiagnosisBox diagnosis={booking.diagnoses} />

                {isAdmin && booking.status === "declined" && (
                  <div className="report-box warn">
                    <h4>Declined by {shop?.shop_name ?? "the shop"}</h4>
                    <p>{booking.decline_reason || "No reason given."}</p>
                  </div>
                )}

                {isAdmin && booking.completion_report && (
                  <div className="report-box">
                    <h4>Mechanic's completion report</h4>
                    <p>{booking.completion_report}</p>
                    {booking.report_submitted_at && (
                      <span className="report-meta">
                        Submitted {formatDate(booking.report_submitted_at)}
                      </span>
                    )}
                  </div>
                )}

                {isAdmin && (booking.status === "pending" || booking.status === "declined") && (
                  <ForwardControl
                    key={`${booking.id}-${booking.status}`}
                    booking={booking}
                    shops={shops}
                    busy={busy}
                    onForward={forwardBooking}
                  />
                )}

                {isAdmin && booking.status === "forwarded" && (
                  <p className="booking-vehicle">
                    Waiting for {shop?.shop_name ?? "the shop"}'s mechanic to
                    accept or decline.
                  </p>
                )}

                {review && (
                  <div className="review-inline">
                    <div className="review-inline-head">
                      <span>
                        {isMine
                          ? "Your review"
                          : `Review by ${review.author_name || "the owner"}`}
                      </span>
                      <StarRating value={review.rating} size={16} />
                    </div>

                    {review.comment && <p>{review.comment}</p>}
                  </div>
                )}

                <div className="shop-card-links">
                  {isAdmin && booking.status === "awaiting_review" && (
                    <button
                      type="button"
                      className="primary-button"
                      disabled={busy}
                      onClick={() => confirmCompletion(booking)}
                    >
                      Confirm completion
                    </button>
                  )}

                  {canReview && reviewingId !== booking.id && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setReviewingId(booking.id)}
                    >
                      Leave a review
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      className="text-button danger"
                      disabled={busy}
                      onClick={() => cancelBooking(booking)}
                    >
                      Cancel booking
                    </button>
                  )}
                </div>

                {canReview && reviewingId === booking.id && (
                  <ReviewForm
                    booking={booking}
                    userId={user.id}
                    onCancel={() => setReviewingId(null)}
                    onDone={(saved) => handleReviewed(booking, saved)}
                  />
                )}
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}

export default Bookings;
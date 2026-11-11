import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import ListSkeleton from "../components/ListSkeleton";
import { StarRating } from "../components/Stars";
import { ReviewForm } from "../components/Reviews";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { confirmDialog } from "../lib/confirm";
import { formatPhone } from "../lib/phone";

const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function Bookings() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";
  const canManage = isAdmin || profile?.role === "mechanic";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let ignore = false;

    supabase
      .from("bookings")
      .select(
        "*, mechanic_shops(shop_name, address, city, phone), vehicles(year, make, model), users(full_name, email), shop_reviews(id, rating, comment, created_at, author_name)"
      )
      .order("created_at", { ascending: false })
      .then(({ data, error: loadError }) => {
        if (ignore) return;
        if (loadError) setError(loadError.message);
        setBookings(data ?? []);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function setStatus(booking, status) {
    if (status === "cancelled") {
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

      if (!ok) return;
    }

    setError("");

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", booking.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setBookings((current) =>
      current.map((b) => (b.id === booking.id ? { ...b, status } : b))
    );
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
            <h1>
              {isAdmin
                ? "All bookings"
                : canManage
                  ? "Shop bookings"
                  : "Your bookings"}
            </h1>
            <p>
              {canManage
                ? "Contact the customer, confirm requests, and mark finished jobs as completed."
                : "Requests you sent to repair shops, and their status."}
            </p>
          </div>

          {!canManage && (
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
            <p>
              {canManage
                ? "New booking requests will show up here."
                : "Pick a shop and send a request to see it here."}
            </p>
          </div>
        )}

        <div className="shop-list">
          {bookings.map((booking) => {
            const shop = booking.mechanic_shops;
            const vehicle = booking.vehicles;
            const canCancel =
              booking.status === "pending" || booking.status === "confirmed";

            const isMine = booking.owner_id === user?.id;
            const review = Array.isArray(booking.shop_reviews)
              ? booking.shop_reviews[0]
              : booking.shop_reviews;
            const canReview =
              isMine && booking.status === "completed" && !review;

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
                    {STATUS_LABEL[booking.status]}
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
                  {canManage && booking.status === "pending" && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setStatus(booking, "confirmed")}
                    >
                      Confirm
                    </button>
                  )}

                  {canManage && booking.status === "confirmed" && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setStatus(booking, "completed")}
                    >
                      Mark completed
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
                      onClick={() => setStatus(booking, "cancelled")}
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
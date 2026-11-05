import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import { StarRating } from "../components/Stars";
import { ReviewForm } from "../components/Reviews";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { confirmDialog } from "../lib/confirm";
import ListSkeleton from "../components/ListSkeleton";

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

function Bookings() {
  const { user, profile } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let ignore = false;

    supabase
      .from("bookings")
      .select(
        "*, mechanic_shops(shop_name, address, city, phone), vehicles(year, make, model), users(full_name, email), shop_reviews(id, rating, comment, created_at, author_name)"
      )
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) setError(error.message);
        setBookings(data ?? []);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  async function setStatus(booking, status) {
    if (status === "cancelled") {
      const ok = await confirmDialog({
        title: "Cancel this booking?",
        message: isAdmin
          ? "The owner will be notified that this booking was cancelled."
          : "The shop will be notified. You'd need to send a new request to book again.",
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
            <h1>{isAdmin ? "All bookings" : "Your bookings"}</h1>
            <p>
              {isAdmin
                ? "Confirm requests and mark finished jobs as completed."
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
            const canCancel =
              booking.status === "pending" || booking.status === "confirmed";

            const isMine = booking.owner_id === user?.id;
            const review = Array.isArray(booking.shop_reviews)
              ? booking.shop_reviews[0]
              : booking.shop_reviews;
            const canReview =
              isMine && booking.status === "completed" && !review;

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

                <div className="booking-meta">
                  <span>
                    <strong>When:</strong>{" "}
                    {formatDate(booking.requested_datetime)}
                  </span>

                  {vehicle && (
                    <span>
                      <strong>Vehicle:</strong> {vehicle.year} {vehicle.make}{" "}
                      {vehicle.model}
                    </span>
                  )}

                  {booking.job_brief && (
                    <span>
                      <strong>Problem:</strong> {booking.job_brief}
                    </span>
                  )}

                  {isAdmin && booking.users && (
                    <span>
                      <strong>Owner:</strong> {booking.users.full_name} (
                      {booking.users.email})
                    </span>
                  )}
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
                  {isAdmin && booking.status === "pending" && (
                    <button
                      type="button"
                      className="primary-button"
                      onClick={() => setStatus(booking, "confirmed")}
                    >
                      Confirm
                    </button>
                  )}

                  {isAdmin && booking.status === "confirmed" && (
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
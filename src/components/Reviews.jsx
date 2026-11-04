import { useState } from "react";

import { StarRating, StarInput } from "./Stars";
import { supabase } from "../lib/supabaseClient";

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

function initials(name) {
  return (name || "Owner")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function RatingSummary({ reviews }) {
  const total = reviews.length;
  const average = total
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
    : 0;

  return (
    <div className="rating-summary">
      <div className="rating-summary-score">
        <strong>{average.toFixed(1)}</strong>
        <StarRating value={average} size={18} />
        <span>
          {total} review{total === 1 ? "" : "s"}
        </span>
      </div>

      <div className="rating-bars">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;

          return (
            <div key={star} className="rating-bar">
              <span>{star}</span>
              <div className="rating-bar-track">
                <div style={{ width: `${total ? (count / total) * 100 : 0}%` }} />
              </div>
              <span>{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewList({ reviews }) {
  const sorted = [...reviews].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <ul className="review-list">
      {sorted.map((review, index) => (
        <li key={review.id ?? index} className="review-card">
          <div className="review-avatar" aria-hidden="true">
            {initials(review.author_name)}
          </div>

          <div className="review-body">
            <div className="review-top">
              <strong>{review.author_name || "Verified owner"}</strong>
              <time>{formatDate(review.created_at)}</time>
            </div>

            <StarRating value={review.rating} size={15} />

            <p>{review.comment || "No written comment."}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ReviewForm({ booking, userId, onDone, onCancel }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    if (rating < 1) {
      setError("Choose a star rating first.");
      return;
    }

    setError("");
    setIsSaving(true);

    const { data, error: saveError } = await supabase
      .from("shop_reviews")
      .insert({
        booking_id: booking.id,
        owner_id: userId,
        shop_id: booking.shop_id,
        rating,
        comment: comment.trim() || null,
      })
      .select()
      .single();

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    onDone(data);
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <h4 className="review-form-title">How was your visit?</h4>

      <StarInput
        name={`rating-${booking.id}`}
        value={rating}
        onChange={setRating}
      />

      <label htmlFor={`comment-${booking.id}`}>
        Tell others about it (optional)
      </label>
      <textarea
        id={`comment-${booking.id}`}
        rows={3}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="What went well? Was the price and timing fair?"
      />
      <p className="comment-count">{comment.length}/500</p>

      {error && <p className="form-error">{error}</p>}

      <div className="vehicle-form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Submit review"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import ListSkeleton from "../components/ListSkeleton";
import DiagnosisBox from "../components/DiagnosisBox";
import { StarRating } from "../components/Stars";
import { ReviewForm } from "../components/Reviews";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../lib/NotificationContext";
import { confirmDialog } from "../lib/confirm";
import { formatPhone } from "../lib/phone";
import { statusLabel } from "../lib/bookingStatus";

const PAGE = 8;
const DAY = 24 * 60 * 60 * 1000;

const ADMIN_TABS = [
  { key: "action", label: "Needs action", statuses: ["pending", "declined", "awaiting_review"] },
  { key: "shops", label: "With shops", statuses: ["forwarded", "confirmed", "in_progress"] },
  { key: "done", label: "Completed", statuses: ["completed"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
  { key: "all", label: "All", statuses: null },
];

const CUSTOMER_TABS = [
  {
    key: "active",
    label: "Active",
    statuses: ["pending", "forwarded", "declined", "confirmed", "in_progress", "awaiting_review"],
  },
  { key: "done", label: "Completed", statuses: ["completed"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
  { key: "all", label: "All", statuses: null },
];

const ADMIN_ACTION = ["pending", "declined", "awaiting_review"];

function formatDate(value) {
  return new Date(value).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function mapsLink(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function vehicleText(vehicle) {
  return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "";
}

function nextStep(booking, isAdmin, canReview) {
  if (isAdmin) {
    switch (booking.status) {
      case "pending":
        return "Review the request and forward it to a shop.";
      case "declined":
        return "The shop declined. Forward it to another shop or cancel it.";
      case "awaiting_review":
        return "The mechanic reported the job finished. Confirm completion.";
      case "forwarded":
        return "Waiting for the shop to accept or decline.";
      case "confirmed":
        return "Accepted by the shop.";
      case "in_progress":
        return "Work is in progress.";
      case "completed":
        return "Completed.";
      default:
        return "Cancelled.";
    }
  }

  switch (booking.status) {
    case "pending":
      return "Waiting for the admin to review your request.";
    case "forwarded":
      return "Sent to the shop, waiting for their answer.";
    case "declined":
      return "Being arranged with another shop.";
    case "confirmed":
      return "Accepted by the shop.";
    case "in_progress":
      return "The shop is working on your vehicle.";
    case "awaiting_review":
      return "The shop finished. Waiting for confirmation.";
    case "completed":
      return canReview ? "Done. Leave a review for the shop." : "Completed.";
    default:
      return "This booking was cancelled.";
  }
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
  const { notifications, markRead } = useNotifications();
  const isAdmin = profile?.role === "admin";
  const tabs = isAdmin ? ADMIN_TABS : CUSTOMER_TABS;

  const [bookings, setBookings] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [tab, setTab] = useState(null);
  const [search, setSearch] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [openIds, setOpenIds] = useState(() => new Set());
  const picked = useRef(false);

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

  // Open on the first tab that has something in it
  useEffect(() => {
    if (loading || picked.current) return;
    picked.current = true;

    const first = tabs.find(
      (item) =>
        item.statuses && bookings.some((b) => item.statuses.includes(b.status))
    );

    setTab(first?.key ?? tabs[0].key);
  }, [loading, bookings, tabs]);

  // Bookings that have unread notifications are the new ones
  const unreadIds = useMemo(() => {
    const map = new Map();

    for (const item of notifications) {
      if (!item.read_at && item.booking_id) {
        map.set(item.booking_id, [...(map.get(item.booking_id) ?? []), item.id]);
      }
    }

    return map;
  }, [notifications]);

  const reviewable = (b) =>
    b.owner_id === user?.id &&
    b.status === "completed" &&
    !(Array.isArray(b.shop_reviews) ? b.shop_reviews[0] : b.shop_reviews);

  const counts = useMemo(() => {
    const result = {};

    for (const item of tabs) {
      result[item.key] = bookings.filter(
        (b) => !item.statuses || item.statuses.includes(b.status)
      ).length;
    }

    return result;
  }, [bookings, tabs]);

  const reviewCount = bookings.filter(reviewable).length;

  const activeTab = tabs.find((item) => item.key === tab) ?? tabs[0];
  const needle = search.trim().toLowerCase();

  const list = useMemo(() => {
    return bookings
      .filter((b) => !activeTab.statuses || activeTab.statuses.includes(b.status))
      .filter((b) => {
        if (!needle) return true;

        return [
          b.mechanic_shops?.shop_name,
          b.customer_name,
          b.users?.full_name,
          vehicleText(b.vehicles),
          b.job_brief,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort(
        (a, b) =>
          (unreadIds.has(a.id) ? 0 : 1) - (unreadIds.has(b.id) ? 0 : 1) ||
          new Date(b.created_at) - new Date(a.created_at)
      );
  }, [bookings, activeTab, needle, unreadIds]);

  // Mechanics work from their own dashboard
  if (profile?.role === "mechanic") {
    return <Navigate to="/mechanic" replace />;
  }

  function changeTab(key) {
    setTab(key);
    setShown(PAGE);
  }

  function toggle(booking) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(booking.id)) next.delete(booking.id);
      else next.add(booking.id);
      return next;
    });

    (unreadIds.get(booking.id) ?? []).forEach((id) => markRead(id));
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

  function renderBooking(booking) {
    const shop = booking.mechanic_shops;
    const vehicle = booking.vehicles;
    const busy = busyId === booking.id;
    const open = openIds.has(booking.id);

    const isMine = booking.owner_id === user?.id;
    const review = Array.isArray(booking.shop_reviews)
      ? booking.shop_reviews[0]
      : booking.shop_reviews;
    const canReview = isMine && booking.status === "completed" && !review;

    const needsAction = isAdmin && ADMIN_ACTION.includes(booking.status);
    const isUnread = unreadIds.has(booking.id);
    const isRecent = Date.now() - new Date(booking.created_at).getTime() < DAY;
    const isNew = isUnread || (isRecent && booking.status === "pending");
    const highlight = isUnread || needsAction || (canReview && !isAdmin);

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
        ["pending", "forwarded", "declined", "confirmed"].includes(booking.status);

    const customerName =
      booking.customer_name || booking.users?.full_name || "Not provided";
    const phone = booking.customer_phone;
    const place = booking.service_address;

    return (
      <article
        key={booking.id}
        className={`shop-card booking-card ${highlight ? "is-highlight" : ""}`}
      >
        <div className="booking-summary">
          <div className="booking-summary-main">
            <div className="booking-badges">
              <span className={`status-chip ${booking.status}`}>
                {statusLabel(booking.status, !isAdmin)}
              </span>
              {isNew && <span className="new-badge">New</span>}
            </div>

            <h3>{shop?.shop_name ?? "Shop no longer listed"}</h3>

            <p className="booking-line">
              {isAdmin && <span>{customerName}</span>}
              {vehicleText(vehicle) && <span>{vehicleText(vehicle)}</span>}
              <span>{formatDate(booking.requested_datetime)}</span>
            </p>

            <p className="booking-next">{nextStep(booking, isAdmin, canReview)}</p>
          </div>

          <button
            type="button"
            className="text-button"
            aria-expanded={open}
            onClick={() => toggle(booking)}
          >
            {open ? "Hide details" : needsAction ? "Review" : "View details"}
          </button>
        </div>

        {open && (
          <div className="booking-details">
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
                  <dd>{vehicleText(vehicle) || "Not provided"}</dd>
                </div>

                <div>
                  <dt>Problem</dt>
                  <dd>{booking.job_brief || "Not provided"}</dd>
                </div>

                <div>
                  <dt>Preferred time</dt>
                  <dd>{formatDate(booking.requested_datetime)}</dd>
                </div>

                {shop && (
                  <div>
                    <dt>Shop address</dt>
                    <dd>
                      {[shop.address, shop.city].filter(Boolean).join(", ")}
                    </dd>
                  </div>
                )}
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

            {isAdmin &&
              (booking.status === "pending" || booking.status === "declined") && (
                <ForwardControl
                  key={`${booking.id}-${booking.status}`}
                  booking={booking}
                  shops={shops}
                  busy={busy}
                  onForward={forwardBooking}
                />
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
          </div>
        )}
      </article>
    );
  }

  const emptyMessage =
    needle
      ? "No bookings match your search."
      : activeTab.key === "action"
        ? "Nothing needs your action right now. Check With shops for requests in progress."
        : activeTab.key === "active"
          ? "You have no active bookings. Check Completed or All."
          : "Nothing here yet.";

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>{isAdmin ? "All bookings" : "Your bookings"}</h1>
            <p>
              {isAdmin
                ? "New requests and anything waiting on you come first."
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

        {!loading && bookings.length > 0 && (
          <>
            <div className="booking-tabs">
              {tabs.map((item) => {
                const alert =
                  (isAdmin && item.key === "action" && counts.action > 0) ||
                  (!isAdmin && item.key === "done" && reviewCount > 0);

                return (
                  <button
                    key={item.key}
                    type="button"
                    className="mail-tab"
                    aria-pressed={activeTab.key === item.key}
                    onClick={() => changeTab(item.key)}
                  >
                    {item.label}
                    <span className={`tab-count ${alert ? "alert" : ""}`}>
                      {counts[item.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="booking-search">
              <label className="sr-only" htmlFor="booking-search">
                Search bookings
              </label>
              <input
                id="booking-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShown(PAGE);
                }}
                placeholder="Search by shop, customer, vehicle or problem"
              />
            </div>

            {list.length === 0 && (
              <div className="empty-state">
                <h2>Nothing here</h2>
                <p>{emptyMessage}</p>
              </div>
            )}

            <div className="shop-list">
              {list.slice(0, shown).map(renderBooking)}
            </div>

            {list.length > shown && (
              <button
                type="button"
                className="secondary-button show-more"
                onClick={() => setShown((count) => count + PAGE)}
              >
                Show more ({list.length - shown} left)
              </button>
            )}
          </>
        )}
      </main>
    </>
  );
}

export default Bookings;
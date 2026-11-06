import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import { StarRating } from "../components/Stars";
import { RatingSummary, ReviewList } from "../components/Reviews";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useVehicles } from "../lib/VehicleContext";
import { CATEGORIES, categoryLabel } from "../lib/categories";
import ListSkeleton from "../components/ListSkeleton";


function mapsUrl(shop) {
  const query = [shop.shop_name, shop.address, shop.city]
    .filter(Boolean)
    .join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

// Value for the "earliest allowed" date input, in local time
function nowLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
}

function BookingForm({ shop, vehicle, onDone, onCancel }) {
  const { user } = useAuth();

  const [when, setWhen] = useState("");
  const [problem, setProblem] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const date = new Date(when);

    if (Number.isNaN(date.getTime()) || date < new Date()) {
      setError("Pick a date and time in the future.");
      return;
    }

    setError("");
    setIsSaving(true);

    const { error: saveError } = await supabase.from("bookings").insert({
      owner_id: user.id,
      vehicle_id: vehicle.id,
      shop_id: shop.id,
      requested_datetime: date.toISOString(),
      job_brief: problem.trim(),
    });

    setIsSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }

    onDone();
  }

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <p className="booking-vehicle">
        Vehicle:{" "}
        <strong>
          {vehicle.year} {vehicle.make} {vehicle.model}
        </strong>
      </p>

      <label htmlFor={`when-${shop.id}`}>Preferred date and time</label>
      <input
        id={`when-${shop.id}`}
        type="datetime-local"
        min={nowLocal()}
        value={when}
        onChange={(e) => setWhen(e.target.value)}
        required
      />

      <label htmlFor={`problem-${shop.id}`}>
        What should the shop check?
      </label>
      <textarea
        id={`problem-${shop.id}`}
        rows={3}
        value={problem}
        onChange={(e) => setProblem(e.target.value)}
        placeholder="Example: Squealing noise when braking, pads may be worn."
        required
      />

      {error && <p className="form-error">{error}</p>}

      <div className="vehicle-form-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isSaving}
        >
          {isSaving ? "Sending..." : "Send request"}
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

function Shops() {
  const navigate = useNavigate();
  const { selectedVehicle } = useVehicles();
  const { profile } = useAuth();
  const canBook =
    profile?.role === "admin" || Boolean(profile?.phone_verified_at);
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category") ?? "";

  const [city, setCity] = useState("");
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingShopId, setBookingShopId] = useState(null);
  const [openReviewsId, setOpenReviewsId] = useState(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let ignore = false;

    supabase
      .from("mechanic_shops")
      .select("*, shop_reviews(id, rating, comment, created_at, author_name)")
      .eq("verified", true)
      .order("rating_avg", { ascending: false })
      .then(({ data, error }) => {
        if (ignore) return;
        if (error) setError(error.message);
        setShops(data ?? []);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const visible = useMemo(() => {
    const term = city.trim().toLowerCase();

    return shops.filter((shop) => {
      const matchesCategory =
        !category || shop.service_categories?.includes(category);

      const matchesArea =
        !term ||
        (shop.city ?? "").toLowerCase().includes(term) ||
        shop.address.toLowerCase().includes(term);

      return matchesCategory && matchesArea;
    });
  }, [shops, category, city]);

  function handleCategory(e) {
    const value = e.target.value;
    setSearchParams(value ? { category: value } : {});
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Find a mechanic</h1>
            <p>Only shops verified by an admin are listed.</p>
          </div>
        </div>

        <div className="filters">
          <div>
            <label htmlFor="category">Problem type</label>
            <select
              id="category"
              value={category}
              onChange={handleCategory}
            >
              <option value="">All types</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="city">City or area</label>
            <input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Davao City"
            />
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
        {loading && <ListSkeleton />}

        {!loading && !error && visible.length === 0 && (
          <div className="empty-state">
            <h2>No shops found</h2>
            <p>Try another problem type or area.</p>
          </div>
        )}

        <div className="shop-list">
          {visible.map((shop) => {
            const reviews = shop.shop_reviews ?? [];

            return (
              <article key={shop.id} className="shop-card">
                <div className="shop-card-top">
                  <div>
                    <h3>{shop.shop_name}</h3>
                    <p>
                      {[shop.address, shop.city].filter(Boolean).join(", ")}
                    </p>
                  </div>

                  <div className="shop-rating">
                    {reviews.length > 0 ? (
                      <>
                        <StarRating value={shop.rating_avg} size={16} />
                        <strong>{Number(shop.rating_avg).toFixed(1)}</strong>
                        <span>({reviews.length})</span>
                      </>
                    ) : (
                      <span>No reviews yet</span>
                    )}
                  </div>
                </div>

                {shop.service_categories?.length > 0 && (
                  <ul className="tag-list">
                    {shop.service_categories.map((c) => (
                      <li key={c}>{categoryLabel(c)}</li>
                    ))}
                  </ul>
                )}

                <div className="shop-card-links">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => setBookingShopId(shop.id)}
                      disabled={
                      !selectedVehicle || !canBook || bookingShopId === shop.id
                    }
                  >
                    Request booking
                  </button>

                  {reviews.length > 0 && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        setOpenReviewsId(
                          openReviewsId === shop.id ? null : shop.id
                        )
                      }
                    >
                      {openReviewsId === shop.id
                        ? "Hide reviews"
                        : "Read reviews"}
                    </button>
                  )}

                  {shop.phone && (
                    <a
                      className="text-button"
                      href={`tel:${shop.phone.replace(/\s+/g, "")}`}
                    >
                      Call {shop.phone}
                    </a>
                  )}

                  <a
                    className="text-button"
                    href={mapsUrl(shop)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Get directions
                  </a>
                </div>

                {selectedVehicle && !canBook && (
                  <p className="booking-vehicle">
                    Verify your phone number to request a booking. Use the
                    banner at the top of the page.
                  </p>
                )}

                {!selectedVehicle && (
                  <p className="booking-vehicle">
                    <Link to="/vehicles" className="text-button">
                      Add a vehicle
                    </Link>{" "}
                    to request a booking.
                  </p>
                )}

                {openReviewsId === shop.id && (
                  <div className="reviews-panel">
                    <RatingSummary reviews={reviews} />
                    <ReviewList reviews={reviews} />
                  </div>
                )}

                {bookingShopId === shop.id && selectedVehicle && (
                  <BookingForm
                    shop={shop}
                    vehicle={selectedVehicle}
                    onCancel={() => setBookingShopId(null)}
                    onDone={() => navigate("/bookings")}
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

export default Shops;
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import ListSkeleton from "../components/ListSkeleton";
import { StarRating } from "../components/Stars";
import { RatingSummary, ReviewList } from "../components/Reviews";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";
import { useVehicles } from "../lib/VehicleContext";
import { CATEGORIES, categoryLabel } from "../lib/categories";
import { formatPhone } from "../lib/phone";
import BookingFormWithDiagnosis from "../components/BookingFormWithDiagnosis";

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

// Best rated first, then most reviewed, then alphabetical
function byRating(a, b) {
  return (
    Number(b.rating_avg) - Number(a.rating_avg) ||
    (b.shop_reviews?.length ?? 0) - (a.shop_reviews?.length ?? 0) ||
    a.shop_name.localeCompare(b.shop_name)
  );
}

function BookingForm({ shop, vehicle, onDone, onCancel }) {
  const { user, profile, refreshProfile } = useAuth();

  const [when, setWhen] = useState("");
  const [address, setAddress] = useState(profile?.address ?? "");
  const [problem, setProblem] = useState("");
  const [saveAddress, setSaveAddress] = useState(!profile?.address);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();

    const date = new Date(when);

    if (Number.isNaN(date.getTime()) || date < new Date()) {
      setError("Pick a date and time in the future.");
      return;
    }

    const place = address.trim();

    if (place.length < 8) {
      setError("Enter your service location so the mechanic can find you.");
      return;
    }

    setError("");
    setIsSaving(true);

    const { error: saveError } = await supabase.from("bookings").insert({
      owner_id: user.id,
      vehicle_id: vehicle.id,
      shop_id: shop.id,
      requested_datetime: date.toISOString(),
      service_address: place,
      job_brief: problem.trim(),
    });

    if (saveError) {
      setIsSaving(false);
      setError(saveError.message);
      return;
    }

    // Keep it as the default address for next time
    if (saveAddress && place !== (profile?.address ?? "")) {
      await supabase.from("users").update({ address: place }).eq("id", user.id);
      await refreshProfile();
    }

    setIsSaving(false);
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

      <p className="share-note">
        The shop will receive your name
        {profile?.phone ? ` and verified number (${formatPhone(profile.phone)})` : ""},
        your vehicle, the problem, and the location below.
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

      <label htmlFor={`place-${shop.id}`}>Service location</label>
      <textarea
        id={`place-${shop.id}`}
        rows={2}
        maxLength={250}
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="House or building, street, barangay, city. Add a landmark if you can."
        required
      />

      {(!profile?.address || address.trim() !== profile.address) && (
        <label className="check-row" htmlFor={`save-${shop.id}`}>
          <input
            id={`save-${shop.id}`}
            type="checkbox"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
          />
          Save this as my default address
        </label>
      )}

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
      return undefined;
    }

    let ignore = false;

    supabase
      .from("mechanic_shops")
      .select("*, shop_reviews(id, rating, comment, created_at, author_name)")
      .eq("verified", true)
      .then(({ data, error: loadError }) => {
        if (ignore) return;
        if (loadError) setError(loadError.message);
        setShops(data ?? []);
        setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Every shop stays visible. A problem type only changes the order.
  const { matches, others, total } = useMemo(() => {
    const term = city.trim().toLowerCase();

    const inArea = shops.filter(
      (shop) =>
        !term ||
        (shop.city ?? "").toLowerCase().includes(term) ||
        shop.address.toLowerCase().includes(term)
    );

    const sorted = [...inArea].sort(byRating);

    if (!category) return { matches: [], others: sorted, total: sorted.length };

    const isMatch = (shop) => shop.service_categories?.includes(category);

    return {
      matches: sorted.filter(isMatch),
      others: sorted.filter((shop) => !isMatch(shop)),
      total: sorted.length,
    };
  }, [shops, category, city]);

  function handleCategory(e) {
    const value = e.target.value;
    setSearchParams(value ? { category: value } : {});
  }

  function renderShop(shop, isMatch) {
    const reviews = shop.shop_reviews ?? [];

    return (
      <article
        key={shop.id}
        className={`shop-card ${isMatch ? "is-match" : ""}`}
      >
        <div className="shop-card-top">
          <div>
            <h3>
              {shop.shop_name}
              {isMatch && <span className="match-badge">Best match</span>}
            </h3>
            <p>{[shop.address, shop.city].filter(Boolean).join(", ")}</p>
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
            disabled={!selectedVehicle || !canBook || bookingShopId === shop.id}
          >
            Request booking
          </button>

          {reviews.length > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={() =>
                setOpenReviewsId(openReviewsId === shop.id ? null : shop.id)
              }
            >
              {openReviewsId === shop.id ? "Hide reviews" : "Read reviews"}
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
            Verify your phone number to request a booking. Use the banner at
            the top of the page.
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
          <BookingFormWithDiagnosis
            initialDiagnosisId={searchParams.get("diagnosis") ?? ""}
            shop={shop}
            vehicle={selectedVehicle}
            onCancel={() => setBookingShopId(null)}
            onDone={() => navigate("/bookings")}
          />
        )}
      </article>
    );
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Find a mechanic</h1>
            <p>
              {category
                ? `All verified shops are shown. The best matches for ${categoryLabel(category)} come first.`
                : "Every shop listed here has been verified by an admin."}
            </p>
          </div>
        </div>

        <div className="filters">
          <div>
            <label htmlFor="category">Best matches for</label>
            <select
              id="category"
              value={category}
              onChange={handleCategory}
            >
              <option value="">Any problem</option>
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

        {!loading && !error && total === 0 && (
          <div className="empty-state">
            <h2>No shops found</h2>
            <p>Try a different city or area.</p>
          </div>
        )}

        {category && total > 0 && matches.length === 0 && (
          <p className="notice-box">
            No shop lists {categoryLabel(category)} as a specialty yet, so here
            are all available shops.
          </p>
        )}

        {matches.length > 0 && (
          <section className="shop-group">
            <h2 className="group-title">
              Best matches for {categoryLabel(category)}
              <span>{matches.length}</span>
            </h2>

            <div className="shop-list">
              {matches.map((shop) => renderShop(shop, true))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section className="shop-group">
            {category && matches.length > 0 && (
              <h2 className="group-title">
                Other available shops
                <span>{others.length}</span>
              </h2>
            )}

            <div className="shop-list">
              {others.map((shop) => renderShop(shop, false))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default Shops;
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import AdminTabs from "../components/AdminTabs";
import { supabase } from "../lib/supabaseClient";
import { timeAgo } from "../lib/notificationUtils";
import { statusLabel } from "../lib/bookingStatus";

const DAY = 24 * 60 * 60 * 1000;

const ROLE_LABEL = { user: "Owner", mechanic: "Mechanic", admin: "Admin" };

const STATUSES = [
  { key: "pending", label: "Pending review" },
  { key: "forwarded", label: "Sent to shop" },
  { key: "confirmed", label: "Accepted" },
  { key: "in_progress", label: "In progress" },
  { key: "awaiting_review", label: "Awaiting admin" },
  { key: "declined", label: "Declined" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
];

function StatCard({ label, value, note, to, attention }) {
  const content = (
    <>
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {note && <span className="stat-note">{note}</span>}
    </>
  );

  const className = `stat-card ${to ? "is-link" : ""} ${attention ? "attention" : ""}`;

  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!supabase) return undefined;

    let ignore = false;

    Promise.all([
      supabase.from("users").select("role, created_at"),
      supabase.from("mechanic_shops").select("verified"),
      supabase.from("bookings").select("status, created_at"),
      supabase.from("shop_reviews").select("rating"),
      supabase
        .from("users")
        .select("id, full_name, role, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("bookings")
        .select(
          "id, status, created_at, mechanic_shops(shop_name), users(full_name)"
        )
        .order("created_at", { ascending: false })
        .limit(5),
    ]).then((results) => {
      if (ignore) return;

      const failed = results.find((result) => result.error);

      if (failed) {
        setError(failed.error.message);
        return;
      }

      setError("");
      setData({
        users: results[0].data,
        shops: results[1].data,
        bookings: results[2].data,
        reviews: results[3].data,
        recentUsers: results[4].data,
        recentBookings: results[5].data,
      });
    });

    return () => {
      ignore = true;
    };
  }, [version]);

  const stats = useMemo(() => {
    if (!data) return null;

    const now = Date.now();

    const roles = { user: 0, mechanic: 0, admin: 0 };
    let newUsers = 0;

    for (const person of data.users) {
      roles[person.role] = (roles[person.role] ?? 0) + 1;
      if (now - new Date(person.created_at).getTime() < 7 * DAY) newUsers += 1;
    }

    const shopsVerified = data.shops.filter((shop) => shop.verified).length;

    const byStatus = Object.fromEntries(STATUSES.map((s) => [s.key, 0]));
    for (const booking of data.bookings) {
      byStatus[booking.status] = (byStatus[booking.status] ?? 0) + 1;
    }

    const average = data.reviews.length
      ? data.reviews.reduce((sum, review) => sum + review.rating, 0) /
        data.reviews.length
      : 0;

    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (6 - index));
      return day;
    });

    const perDay = days.map((day, index) => {
      const start = day.getTime();
      const end = start + DAY;

      return {
        label: day.toLocaleDateString("en-PH", { weekday: "short" }),
        isToday: index === 6,
        count: data.bookings.filter((booking) => {
          const created = new Date(booking.created_at).getTime();
          return created >= start && created < end;
        }).length,
      };
    });

    return {
      roles,
      newUsers,
      shopsVerified,
      shopsPending: data.shops.length - shopsVerified,
      byStatus,
      average,
      perDay,
      maxPerDay: Math.max(1, ...perDay.map((day) => day.count)),
      maxStatus: Math.max(1, ...Object.values(byStatus)),
    };
  }, [data]);

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Admin dashboard</h1>
            <p>A live overview of everything happening in E-Kaniko.</p>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setVersion((current) => current + 1)}
          >
            Refresh
          </button>
        </div>

        <AdminTabs />

        {error && <p className="form-error">{error}</p>}

        {!stats && !error && (
          <div className="stat-grid" role="status" aria-label="Loading">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="stat-card">
                <span className="skeleton-line w40" />
                <span className="skeleton-line w25" />
                <span className="skeleton-line w70" />
              </div>
            ))}
          </div>
        )}

        {stats && (
          <>
            <div className="stat-grid">
              <StatCard
                label="Total users"
                value={data.users.length}
                note={`${stats.roles.user} owners, ${stats.roles.mechanic} mechanics, ${stats.roles.admin} admins. ${stats.newUsers} new in the last 7 days.`}
                to="/admin/users"
              />

              <StatCard
                label="Verified shops"
                value={stats.shopsVerified}
                note={`${data.shops.length} shops in total`}
              />

              <StatCard
                label="Shops to verify"
                value={stats.shopsPending}
                note={
                  stats.shopsPending > 0
                    ? "Waiting for your review"
                    : "Nothing waiting"
                }
                to="/admin/shops"
                attention={stats.shopsPending > 0}
              />

              <StatCard
                label="Pending bookings"
                value={stats.byStatus.pending}
                note={
                  stats.byStatus.pending > 0
                    ? "Waiting to be confirmed"
                    : "All caught up"
                }
                to="/bookings"
                attention={stats.byStatus.pending > 0}
              />

              <StatCard
                label="Completed jobs"
                value={stats.byStatus.completed}
                note={`${data.bookings.length} bookings in total`}
              />

              <StatCard
                label="Average rating"
                value={data.reviews.length ? stats.average.toFixed(1) : "None"}
                note={
                  data.reviews.length
                    ? `From ${data.reviews.length} review${data.reviews.length === 1 ? "" : "s"}`
                    : "No reviews yet"
                }
              />
            </div>

            <div className="panel-grid">
              <section className="panel">
                <h2>Bookings, last 7 days</h2>
                <p className="panel-sub">New requests created per day</p>

                <div className="bar-chart">
                  {stats.perDay.map((day) => (
                    <div key={day.label + day.isToday} className="bar-col">
                      <span className="bar-count">{day.count}</span>

                      <div className="bar-track">
                        <div
                          className={`bar ${day.isToday ? "today" : ""}`}
                          style={{
                            height: `${(day.count / stats.maxPerDay) * 100}%`,
                          }}
                        />
                      </div>

                      <span className="bar-label">
                        {day.isToday ? "Today" : day.label}
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <h2>Booking status</h2>
                <p className="panel-sub">All bookings, by where they stand</p>

                <div className="status-rows">
                  {STATUSES.map((status) => (
                    <div key={status.key} className="status-row">
                      <span>{status.label}</span>

                      <div className="status-track">
                        <div
                          className={`s-${status.key}`}
                          style={{
                            width: `${(stats.byStatus[status.key] / stats.maxStatus) * 100}%`,
                          }}
                        />
                      </div>

                      <strong>{stats.byStatus[status.key]}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="panel-grid">
              <section className="panel">
                <h2>Recent sign-ups</h2>
                <p className="panel-sub">
                  <Link to="/admin/users" className="text-button">
                    See all users
                  </Link>
                </p>

                {data.recentUsers.length === 0 ? (
                  <p className="mini-empty">No sign-ups yet.</p>
                ) : (
                  <ul className="mini-list">
                    {data.recentUsers.map((person) => (
                      <li key={person.id}>
                        <div className="mini-main">
                          <strong>{person.full_name || "No name"}</strong>
                          <span>{ROLE_LABEL[person.role] ?? person.role}</span>
                        </div>

                        <span className="mini-time">
                          {timeAgo(person.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="panel">
                <h2>Recent bookings</h2>
                <p className="panel-sub">
                  <Link to="/bookings" className="text-button">
                    Open all bookings
                  </Link>
                </p>

                {data.recentBookings.length === 0 ? (
                  <p className="mini-empty">No bookings yet.</p>
                ) : (
                  <ul className="mini-list">
                    {data.recentBookings.map((booking) => (
                      <li key={booking.id}>
                        <div className="mini-main">
                          <strong>
                            {booking.mechanic_shops?.shop_name ?? "Shop removed"}
                          </strong>
                          <span>
                            {booking.users?.full_name ?? "Unknown owner"}
                          </span>
                        </div>

                        <div className="mini-side">
                          <span className={`status-chip ${booking.status}`}>
                            {statusLabel(booking.status)}
                          </span>
                          <span className="mini-time">
                            {timeAgo(booking.created_at)}
                          </span>
                        </div>
                      </li>
                    ))} 
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </>
  );
}

export default AdminDashboard;
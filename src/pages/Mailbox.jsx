import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import { useAuth } from "../lib/AuthContext";
import { useNotifications } from "../lib/NotificationContext";
import { kindOf, timeAgo } from "../lib/notificationUtils";

const SUBTITLE = {
  admin: "New requests and activity across E-Kaniko.",
  mechanic: "Bookings and reviews for your shop.",
  user: "Updates about your bookings and reviews.",
};

function Mailbox() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    removeNotification,
  } = useNotifications();

  const [filter, setFilter] = useState("all");

  const visible =
    filter === "unread"
      ? notifications.filter((n) => !n.read_at)
      : notifications;

  function openItem(item) {
    markRead(item.id);
    if (item.link) navigate(item.link);
  }

  return (
    <>
      <Navbar />

      <main className="page">
        <div className="page-head">
          <div>
            <h1>Mailbox</h1>
            <p>{SUBTITLE[profile?.role] ?? SUBTITLE.user}</p>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="secondary-button"
              onClick={markAllRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        <div className="mail-tabs">
          <button
            type="button"
            className="mail-tab"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            type="button"
            className="mail-tab"
            aria-pressed={filter === "unread"}
            onClick={() => setFilter("unread")}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {loading && <p>Loading messages...</p>}

        {!loading && visible.length === 0 && (
          <div className="empty-state">
            <h2>
              {filter === "unread" ? "Nothing unread" : "Your mailbox is empty"}
            </h2>
            <p>New booking updates and reviews will show up here.</p>
          </div>
        )}

        <ul className="mail-list">
          {visible.map((item) => (
            <li
              key={item.id}
              className={`mail-item kind-${kindOf(item.type)} ${item.read_at ? "" : "unread"}`}
            >
              <button
                type="button"
                className="mail-main"
                onClick={() => openItem(item)}
              >
                <strong className="mail-title">{item.title}</strong>
                <span className="mail-body">{item.body}</span>
                <span className="mail-time">{timeAgo(item.created_at)}</span>
              </button>

              <button
                type="button"
                className="text-button danger"
                onClick={() => removeNotification(item.id)}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export default Mailbox;
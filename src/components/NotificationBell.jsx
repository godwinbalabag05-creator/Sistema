import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import NotifIcon from "./NotifIcon";
import { useNotifications } from "../lib/NotificationContext";
import { kindOf, timeAgo } from "../lib/notificationUtils";

function NotificationBell() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } =
    useNotifications();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;

    function onPointer(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }

    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function openItem(item) {
    markRead(item.id);
    setOpen(false);
    if (item.link) navigate(item.link);
  }

  const latest = notifications.slice(0, 6);

  return (
    <div className="bell" ref={ref}>
      <button
        type="button"
        className="bell-button"
        aria-label={
          unreadCount > 0
            ? `Notifications, ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>

        {unreadCount > 0 && (
          <span className="bell-badge">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Always rendered so it can fade out; hidden items can't be tabbed to */}
      <div
        className={`bell-panel ${open ? "is-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="bell-panel-head">
          <strong>Notifications</strong>

          {unreadCount > 0 && (
            <button
              type="button"
              className="text-button"
              onClick={markAllRead}
            >
              Mark all as read
            </button>
          )}
        </div>

        {latest.length === 0 ? (
          <p className="bell-empty">You're all caught up.</p>
        ) : (
          <ul>
            {latest.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`bell-item kind-${kindOf(item.type)} ${item.read_at ? "" : "unread"}`}
                  onClick={() => openItem(item)}
                >
                  <NotifIcon type={item.type} />
                  <span className="bell-item-title">{item.title}</span>
                  <span className="bell-item-body">{item.body}</span>
                  <span className="bell-item-time">
                    {timeAgo(item.created_at)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link
          to="/mailbox"
          className="bell-footer"
          onClick={() => setOpen(false)}
        >
          Open mailbox
        </Link>
      </div>
    </div>
  );
}

export default NotificationBell;
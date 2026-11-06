const ICONS = {
  user: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M19 8v6M22 11h-6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  cross: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="2" />
      <path d="M11 18h2" />
    </>
  ),
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
};

const BY_TYPE = {
  user_registered: "user",
  booking_sent: "calendar",
  booking_new: "calendar",
  booking_confirmed: "check",
  booking_completed: "check",
  shop_verified: "check",
  booking_cancelled: "cross",
  review_new: "star",
  phone_code: "phone",
};

function NotifIcon({ type }) {
  const icon = ICONS[BY_TYPE[type] ?? "calendar"];

  return (
    <span className="notif-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24">{icon}</svg>
    </span>
  );
}

export default NotifIcon;
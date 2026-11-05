export function timeAgo(value) {
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(value).toLocaleDateString("en-PH", { dateStyle: "medium" });
}

// Decides the color stripe of a notification
export function kindOf(type) {
  if (type === "user_registered") return "new";
  if (["booking_confirmed", "booking_completed", "shop_verified"].includes(type)) {
    return "good";
  }
  if (type === "booking_cancelled") return "bad";
  if (type === "review_new") return "star";
  return "info";
}
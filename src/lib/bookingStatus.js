const LABELS = {
  pending: "Pending review",
  forwarded: "Sent to shop",
  confirmed: "Accepted",
  declined: "Declined",
  in_progress: "In progress",
  awaiting_review: "Awaiting admin",
  completed: "Completed",
  cancelled: "Cancelled",
};

// Customers see friendlier wording for the behind-the-scenes steps
const OWNER_LABELS = {
  ...LABELS,
  declined: "Being rearranged",
  awaiting_review: "Awaiting confirmation",
};

export function statusLabel(status, forOwner = false) {
  const labels = forOwner ? OWNER_LABELS : LABELS;
  return labels[status] ?? status;
}
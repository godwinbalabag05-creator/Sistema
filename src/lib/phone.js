// Turns 0917 123 4567, 639171234567 or +63 917 123 4567 into +639171234567
export function normalizePhone(input) {
  const cleaned = String(input ?? "").replace(/[^\d+]/g, "");

  let local = cleaned;
  if (cleaned.startsWith("+63")) local = cleaned.slice(3);
  else if (cleaned.startsWith("63")) local = cleaned.slice(2);
  else if (cleaned.startsWith("0")) local = cleaned.slice(1);

  return /^9\d{9}$/.test(local) ? `+63${local}` : null;
}

// +639171234567 becomes +63 917 123 4567
export function formatPhone(value) {
  if (!value) return "";

  const match = /^\+63(\d{3})(\d{3})(\d{4})$/.exec(value);
  return match ? `+63 ${match[1]} ${match[2]} ${match[3]}` : value;
}
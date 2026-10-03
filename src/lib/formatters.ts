import { format, formatDistanceToNow, isBefore, isAfter } from "date-fns";

/**
 * Format paise (minor units) to Indian Rupee (₹) string
 * Example: 150050 paise -> ₹1,500.50
 */
export function formatINR(paise: number, includeDecimals = true): string {
  if (isNaN(paise) || paise === null || paise === undefined) return "₹0";
  const rupees = paise / 100;
  if (!includeDecimals || paise % 100 === 0) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rupees);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Convert rupees to integer paise
 */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format standard club date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy, hh:mm a");
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd MMM yyyy");
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "hh:mm a");
}

export function formatRelative(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Calculate age from Date of Birth
 */
export function calculateAge(dob: Date | string): number {
  const birthDate = typeof dob === "string" ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

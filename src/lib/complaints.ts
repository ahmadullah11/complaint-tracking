// Shared (client + server safe) complaint helpers.

export const COMPLAINT_CATEGORIES = [
  "Electricity",
  "Water Supply",
  "Gas",
  "Roads & Infrastructure",
  "Sanitation & Waste",
  "Police & Security",
  "Health",
  "Education",
  "Revenue & Records",
  "Other",
] as const;

export const COMPLAINT_STATUSES = [
  "Pending",
  "Under Review",
  "In Progress",
  "Resolved",
  "Closed",
] as const;

export const TRACKING_PREFIX = "CMP";
export const TIMEZONE = "Asia/Karachi";

export type ComplaintInput = {
  fullName: string;
  cnic: string;
  mobile: string;
  email: string;
  category?: string;
  subject: string;
  description: string;
};

export function normalizeCnic(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeMobile(value: string): string {
  let v = value.replace(/[\s-]/g, "");
  if (/^\+92\d{10}$/.test(v)) v = `0${v.slice(3)}`;
  if (/^92\d{10}$/.test(v)) v = `0${v.slice(2)}`;
  return v;
}

export function validateComplaintInput(
  raw: unknown,
): { ok: true; data: ComplaintInput } | { ok: false; errors: Record<string, string> } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (key: string) => (typeof r[key] === "string" ? (r[key] as string).trim() : "");

  const fullName = str("fullName").replace(/\s+/g, " ");
  const cnic = normalizeCnic(str("cnic"));
  const mobile = normalizeMobile(str("mobile"));
  const email = str("email").toLowerCase();
  const category = str("category");
  const subject = str("subject");
  const description = str("description");

  const errors: Record<string, string> = {};
  if (fullName.length < 3 || fullName.length > 120) {
    errors.fullName = "Enter your full name (3–120 characters).";
  }
  if (!/^\d{13}$/.test(cnic)) {
    errors.cnic = "CNIC must be 13 digits, e.g. 3520212345678 (dashes are allowed).";
  }
  if (!/^03\d{9}$/.test(mobile)) {
    errors.mobile = "Enter a valid mobile number, e.g. 03001234567.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 255) {
    errors.email = "Enter a valid email address.";
  }
  if (subject.length < 5 || subject.length > 200) {
    errors.subject = "Subject must be 5–200 characters.";
  }
  if (description.length < 20 || description.length > 2000) {
    errors.description = "Describe your complaint in 20–2000 characters.";
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    data: { fullName, cnic, mobile, email, category, subject, description },
  };
}

/**
 * Builds a tracking number from the date and time (to the second) in Pakistan time:
 * CMP + YYYY + MM + DD + HH + mm + ss  →  e.g. CMP20260315143045
 */
export function formatTrackingNumber(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${TRACKING_PREFIX}${get("year")}${get("month")}${get("day")}${get("hour")}${get("minute")}${get("second")}`;
}

export function isTrackingNumber(value: string): boolean {
  return new RegExp(`^${TRACKING_PREFIX}\\d{14}$`).test(value);
}

export function formatDateTime(value: string | Date): string {
  return new Date(value).toLocaleString("en-PK", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function maskCnic(cnic: string): string {
  return `${cnic.slice(0, 5)}-XXXXXXX-${cnic.slice(-1)}`;
}

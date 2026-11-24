"use client";

import { useEffect, useState, type FormEvent } from "react";
import { COMPLAINT_STATUSES, formatDateTime } from "@/lib/complaints";

type Complaint = {
  trackingNumber: string;
  category?: string;
  subject: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  fullName: string;
};

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  "Under Review": "bg-sky-100 text-sky-800",
  "In Progress": "bg-indigo-100 text-indigo-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-200 text-slate-700",
};

export default function TrackForm() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [complaint, setComplaint] = useState<Complaint | null>(null);

  async function lookup(value: string) {
    const trimmed = value.trim().toUpperCase();
    if (!trimmed) {
      setError("Enter your tracking number.");
      return;
    }
    setLoading(true);
    setError("");
    setComplaint(null);
    try {
      const res = await fetch(`/api/complaints/track?number=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Complaint not found.");
        return;
      }
      setComplaint(data.complaint);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Pre-fill from ?number=... (e.g. after submitting a complaint).
  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("number");
    if (fromUrl) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNumber(fromUrl);
      void lookup(fromUrl);
    }
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    lookup(number);
  }

  const currentIndex = complaint ? COMPLAINT_STATUSES.indexOf(complaint.status as (typeof COMPLAINT_STATUSES)[number]) : -1;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.12)] sm:flex-row sm:p-8">
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g. CMP20260315143045"
          className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-mono uppercase tracking-wider outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Track status"}
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {complaint ? (
        <div className="space-y-6 rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.12)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Tracking number</p>
              <p className="font-mono text-xl font-bold text-slate-900">{complaint.trackingNumber}</p>
            </div>
            <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusStyles[complaint.status] ?? "bg-slate-100 text-slate-700"}`}>
              {complaint.status}
            </span>
          </div>

          <ol className="grid grid-cols-5 gap-2 text-center text-xs">
            {COMPLAINT_STATUSES.map((s, i) => (
              <li key={s} className="space-y-2">
                <div className={`mx-auto h-2 w-full rounded-full ${i <= currentIndex ? "bg-indigo-600" : "bg-slate-200"}`} />
                <span className={i <= currentIndex ? "font-semibold text-indigo-700" : "text-slate-400"}>{s}</span>
              </li>
            ))}
          </ol>

          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Complainant</dt>
              <dd className="font-medium text-slate-900">{complaint.fullName}</dd>
            </div>
            {complaint.category ? (
              <div>
                <dt className="text-slate-500">Category</dt>
                <dd className="font-medium text-slate-900">{complaint.category}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-slate-500">Submitted</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(complaint.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Last updated</dt>
              <dd className="font-medium text-slate-900">{formatDateTime(complaint.updatedAt)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Subject</dt>
              <dd className="font-medium text-slate-900">{complaint.subject}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-slate-500">Description</dt>
              <dd className="whitespace-pre-line text-slate-700">{complaint.description}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

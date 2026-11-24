"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { formatDateTime, maskCnic } from "@/lib/complaints";

type Account = {
  fullName: string;
  cnic: string;
  mobile: string;
  email: string;
  createdAt: string;
};

type ComplaintRow = {
  trackingNumber: string;
  category?: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  "Under Review": "bg-sky-100 text-sky-800",
  "In Progress": "bg-indigo-100 text-indigo-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Closed: "bg-slate-200 text-slate-700",
};

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

export default function AccountView() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const params = new URLSearchParams({
      cnic: String(fd.get("cnic") ?? ""),
      mobile: String(fd.get("mobile") ?? ""),
    });
    setLoading(true);
    setError("");
    setAccount(null);
    try {
      const res = await fetch(`/api/account?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not load account.");
        return;
      }
      setAccount(data.account);
      setComplaints(data.complaints);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="grid gap-4 rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.12)] sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-8">
        <label className="block text-sm font-medium text-slate-700">
          CNIC
          <input name="cnic" className={inputClass} placeholder="35202-1234567-8" required />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mobile number
          <input name="mobile" className={inputClass} placeholder="03001234567" required />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-indigo-600 px-6 py-2.5 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Loading..." : "Open account"}
        </button>
      </form>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {account ? (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.12)] sm:p-8">
            <h2 className="text-xl font-semibold text-slate-950">{account.fullName}</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-slate-500">CNIC</dt>
                <dd className="font-medium">{maskCnic(account.cnic)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Mobile</dt>
                <dd className="font-medium">{account.mobile}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="font-medium">{account.email}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_rgba(16,24,40,0.12)]">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="font-semibold text-slate-950">My complaints ({complaints.length})</h3>
              <Link href="/complaint" className="text-sm font-medium text-indigo-700 hover:underline">
                + New complaint
              </Link>
            </div>
            {complaints.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-slate-500">No complaints yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">Tracking no.</th>
                      <th className="px-6 py-3 font-medium">Subject</th>
                      <th className="px-6 py-3 font-medium">Submitted</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {complaints.map((c) => (
                      <tr key={c.trackingNumber} className="hover:bg-slate-50">
                        <td className="px-6 py-3">
                          <Link href={`/track?number=${c.trackingNumber}`} className="font-mono font-semibold text-indigo-700 hover:underline">
                            {c.trackingNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-3">{c.subject}</td>
                        <td className="px-6 py-3 whitespace-nowrap">{formatDateTime(c.createdAt)}</td>
                        <td className="px-6 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[c.status] ?? "bg-slate-100 text-slate-700"}`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

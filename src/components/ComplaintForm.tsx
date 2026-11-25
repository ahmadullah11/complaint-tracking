"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Submitted = { trackingNumber: string; createdAt: string };

const inputClass =
  "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200";

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={name}>
      {label}
      {children}
      {error ? <span className="mt-1 block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

export default function ComplaintForm() {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [submitted, setSubmitted] = useState<Submitted | null>(null);
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setSubmitting(true);
    setErrors({});
    setFormError("");

    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Read as text first: a Vercel crash can return an HTML/plain-text 500
      // instead of JSON, and we still want to show the real reason.
      const raw = await res.text();
      let data: Record<string, unknown> = {};
      if (raw) {
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          data = {};
        }
      }

      if (!res.ok) {
        const fieldErrors =
          data.errors && typeof data.errors === "object"
            ? (data.errors as Record<string, string>)
            : {};
        const serverMessage = typeof data.error === "string" ? data.error.trim() : "";

        setErrors(fieldErrors);
        setFormError(
          serverMessage || `Request failed (HTTP ${res.status}). Please try again later.`,
        );
        return;
      }

      if (typeof data.trackingNumber !== "string" || typeof data.createdAt !== "string") {
        setFormError("The server returned an unexpected response. Please try again.");
        return;
      }

      setSubmitted({ trackingNumber: data.trackingNumber, createdAt: data.createdAt });
      form.reset();
    } catch {
      setFormError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyNumber(num: string) {
    await navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (submitted) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-[0_24px_60px_rgba(16,24,40,0.12)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
          ✓
        </div>
        <h2 className="mt-4 text-2xl font-semibold text-slate-950">Complaint submitted</h2>
        <p className="mt-2 text-sm text-slate-600">
          Save this tracking number. You can use it to check your complaint status at any time.
        </p>
        <div className="mt-6 rounded-2xl border-2 border-dashed border-indigo-300 bg-indigo-50 p-5">
          <p className="text-xs uppercase tracking-[0.1em] text-indigo-700">Tracking number</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-indigo-900">
            {submitted.trackingNumber}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Submitted on {new Date(submitted.createdAt).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => copyNumber(submitted.trackingNumber)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
          >
            {copied ? "Copied!" : "Copy number"}
          </button>
          <Link
            href={`/track?number=${submitted.trackingNumber}`}
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Track this complaint
          </Link>
          <button
            type="button"
            onClick={() => setSubmitted(null)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-8 rounded-3xl bg-white p-6 shadow-[0_24px_60px_rgba(16,24,40,0.12)] sm:p-8"
    >
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-slate-950">1. Your registration details</legend>
        <p className="text-sm text-slate-500">These details create your account so you can see all your complaints.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" name="fullName" error={errors.fullName}>
            <input id="fullName" name="fullName" className={inputClass} placeholder="Ali Khan" autoComplete="name" />
          </Field>
          <Field label="CNIC (13 digits)" name="cnic" error={errors.cnic}>
            <input
              id="cnic"
              name="cnic"
              inputMode="numeric"
              className={inputClass}
              placeholder="35202-1234567-8"
              autoComplete="off"
            />
          </Field>
          <Field label="Mobile number" name="mobile" error={errors.mobile}>
            <input
              id="mobile"
              name="mobile"
              inputMode="tel"
              className={inputClass}
              placeholder="03001234567"
              autoComplete="tel"
            />
          </Field>
          <Field label="Email address" name="email" error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              className={inputClass}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-slate-950">2. Complaint details</legend>
        <Field label="Subject" name="subject" error={errors.subject}>
          <input id="subject" name="subject" className={inputClass} placeholder="Short summary of the issue" />
        </Field>
        <Field label="Description" name="description" error={errors.description}>
          <textarea
            id="description"
            name="description"
            rows={6}
            className={inputClass}
            placeholder="Describe the problem, location, and when it started..."
          />
        </Field>
      </fieldset>

      {formError ? (
        <div
          role="alert"
          className="whitespace-pre-line break-words rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting..." : "Submit complaint"}
      </button>
    </form>
  );
}

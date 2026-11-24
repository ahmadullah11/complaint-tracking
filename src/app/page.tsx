import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <section className="rounded-3xl bg-white p-10 shadow-[0_24px_60px_rgba(16,24,40,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.1em] text-indigo-700">Online complaint portal</p>
        <h1 className="mt-4 text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.05] text-slate-950">
          File a complaint in minutes. Track it any time.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-700">
          Register with your CNIC, mobile number and email, describe your problem, and receive a unique tracking
          number. Your complaints are saved to your account.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/complaint" className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">
            File a complaint
          </Link>
          <Link href="/track" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50">
            Track with tracking number
          </Link>
          <Link href="/account" className="rounded-xl border border-slate-300 px-5 py-3 font-semibold hover:bg-slate-50">
            View my account
          </Link>
        </div>
      </section>
    </main>
  );
}

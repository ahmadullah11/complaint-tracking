import Link from "next/link";

export default function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <Link href="/" className="text-lg font-bold text-indigo-700">
          CitizenCare Complaints
        </Link>
        <div className="flex gap-1 text-sm font-medium">
          <Link href="/complaint" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            File complaint
          </Link>
          <Link href="/track" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            Track status
          </Link>
          <Link href="/account" className="rounded-lg px-3 py-2 hover:bg-slate-100">
            My account
          </Link>
        </div>
      </nav>
    </header>
  );
}

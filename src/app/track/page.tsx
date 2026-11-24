import TrackForm from "@/components/TrackForm";

export default function TrackPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Track your complaint</h1>
      <p className="mt-2 mb-8 text-slate-600">Enter the tracking number you received to see the current status.</p>
      <TrackForm />
    </main>
  );
}

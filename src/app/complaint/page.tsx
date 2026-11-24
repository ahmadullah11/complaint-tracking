import ComplaintForm from "@/components/ComplaintForm";

export default function ComplaintPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">Register a complaint</h1>
      <p className="mt-2 mb-8 text-slate-600">
        Fill in your details and the complaint. You will receive a tracking number after submission.
      </p>
      <ComplaintForm />
    </main>
  );
}

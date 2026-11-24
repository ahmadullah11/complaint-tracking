import AccountView from "@/components/AccountView";

export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-950">My account</h1>
      <p className="mt-2 mb-8 text-slate-600">
        Enter your CNIC and registered mobile number to see all complaints saved to your account.
      </p>
      <AccountView />
    </main>
  );
}

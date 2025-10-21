export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-4">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-6">Your privacy matters. This policy explains what we collect and how we use it.</p>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">What We Collect</h2>
        <ul className="list-disc ml-6 space-y-1 text-sm text-slate-300">
          <li>Basic account info: name and email to create your profile and provide services.</li>
          <li>Usage data: course progress and interactions to improve learning.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Payments</h2>
        <ul className="list-disc ml-6 space-y-1 text-sm text-slate-300">
          <li>We never store card or bank details.</li>
          <li>Manual UPI/QR payments require only a transaction reference or receipt; we store minimal metadata to verify access.</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Cookies and Storage</h2>
        <p className="text-sm text-slate-300">We use cookies/local storage to keep you signed in and to personalize your experience.</p>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Data Rights</h2>
        <ul className="list-disc ml-6 space-y-1 text-sm text-slate-300">
          <li>You can request access, correction, or deletion of your personal data.</li>
          <li>Contact support@maxsec.academy to make a request.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Updates</h2>
        <p className="text-sm text-slate-300">We may update this policy. We’ll post changes on this page.</p>
      </section>
      </div>
    </div>
  );
}

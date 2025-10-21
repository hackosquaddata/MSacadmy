export default function LegalPrivacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-200">
      <h1 className="text-2xl font-semibold mb-4">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-3">We care about your privacy. This policy explains what data we collect and how we use it.</p>
      <ul className="list-disc ml-6 space-y-2 text-sm text-slate-300">
        <li>We collect minimal profile data to provide services.</li>
        <li>Payments are processed manually; we store necessary metadata only.</li>
        <li>You can request data deletion by contacting support.</li>
        <li>We use cookies/local storage to keep you signed in.</li>
      </ul>
    </div>
  );
}

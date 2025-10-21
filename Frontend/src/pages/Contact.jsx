import { useNavigate } from 'react-router-dom';

export default function Contact() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-4">Contact</h1>
        <p className="text-sm text-slate-400 mb-4">For account or payment help, open a Support ticket or email us.</p>
        <div className="flex gap-2">
          <button onClick={() => navigate('/support')} className="px-3 py-2 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 text-sm">Open Support</button>
          <a href="mailto:officialmnhz@gmail.com" className="px-3 py-2 rounded-md bg-white/5 border border-white/10 text-sm">Email support@maxsec.academy</a>
        </div>
      </div>
    </div>
  );
}

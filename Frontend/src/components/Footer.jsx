import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 bg-[#0a0f14] text-slate-300">
      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 flex items-center gap-3">
          <img
            src="/logo.png"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.svg'; }}
            alt="Logo"
            className="h-20 w-20 rounded-[25px] object-cover shrink-0"
          />
          <div>
            <div className="text-xs text-slate-400">Managed by Hackosquad</div>
          </div>
        </div>
        <div>
          <div className="text-slate-200 font-semibold mb-2 text-sm">Company</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/support" className="hover:text-white">Support</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-slate-200 font-semibold mb-2 text-sm">Legal</div>
          <ul className="space-y-1 text-sm">
            <li><Link to="/terms" className="hover:text-white">Terms & Conditions</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-slate-200 font-semibold mb-2 text-sm">Payments</div>
          <p className="text-xs text-slate-400">UPI / QR supported. PhonePe coming soon.</p>
          <p className="text-xs text-slate-400 mt-2">Note: Purchases are final and non-refundable once access is granted.</p>
        </div>
      </div>
      <div className="px-4 py-3 text-center text-xs text-slate-500 border-t border-white/10 bg-[#0a0f14]">
        © {new Date().getFullYear()} Managed by Hackosquad
      </div>
    </footer>
  );
}

import { Link } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

export default function Landing() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#070b10] via-[#0a121a] to-black text-slate-100">
      {/* Animated background: gradient + beams */}
      <div className="fixed inset-0 -z-10 animate-gradient-move hero-gradient" aria-hidden></div>
      <div className="fixed inset-0 -z-10 beams" aria-hidden></div>
      <div className="fixed inset-0 -z-10 aurora" aria-hidden></div>
      <div className="fixed inset-0 -z-10 spotlight" aria-hidden></div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo size={44} withTagline={true} taglineText="Managed by Hackosquad" showWordmark={true} />
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/about" className="text-slate-300 hover:text-white">About</Link>
          <Link to="/contact" className="text-slate-300 hover:text-white">Contact</Link>
          <Link to="/login" className="px-3 py-1.5 rounded-md bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10">Sign in</Link>
        </nav>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-5xl px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
          <div className="flex justify-center">
            <BrandLogo size={120} withTagline={false} showWordmark={false} />
          </div>
          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight">
            Master cybersecurity through practice.
          </h1>
          <p className="mt-4 text-slate-400 text-lg max-w-2xl mx-auto">
            Real labs. Real scenarios. Measurable progress. Earn skill‑first certifications that prove capability—not just completion.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="px-6 py-3 rounded-lg bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 hover:bg-emerald-500/30 font-semibold">Create account</Link>
            <Link to="/login" className="px-6 py-3 rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 font-semibold">Sign in</Link>
          </div>

          {/* How it works */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            {[
              { t: '1. Learn by doing', d: 'Follow guided modules with realistic scenarios and lab tasks.' },
              { t: '2. Prove your skills', d: 'Complete assessments that validate capability, not memory.' },
              { t: '3. Exams & certifications', d: 'Pass proctored exams and earn credentials that reflect real skill.' }
            ].map((item) => (
              <div key={item.t} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="text-slate-200 font-medium">{item.t}</div>
                <div className="text-slate-400 text-sm mt-1">{item.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured module preview */}
        <section className="mx-auto max-w-5xl px-6 pb-12">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shimmer-border">
            <div className="flex items-center justify-between">
              <div className="text-slate-300 text-sm">Featured module</div>
              <span className="inline-flex items-center gap-2 text-[11px] text-emerald-300/90">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Live
              </span>
            </div>
            <div className="mt-3 rounded-lg border border-white/10 bg-black/40">
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-black/30">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-green-500/70"></span>
                <span className="ml-3 text-[11px] text-slate-500">terminal • analyst@lab</span>
              </div>
              {/* Terminal body */}
              <div className="p-4 font-mono text-[13px] leading-relaxed text-slate-200/90">
                <div><span className="text-emerald-300">$</span> date</div>
                <div className="text-slate-400">Tue Oct 21 12:41:08 UTC 2025</div>

                <div className="mt-2"><span className="text-emerald-300">$</span> curl -s -D- https://target.local | head -n 6</div>
                <div className="text-slate-400">HTTP/2 200</div>
                <div className="text-slate-400">server: nginx</div>
                <div className="text-slate-400">content-type: text/html; charset=utf-8</div>
                <div className="text-slate-400">strict-transport-security: max-age=31536000; includeSubDomains</div>
                <div className="text-slate-400">content-security-policy: default-src 'self'</div>
                <div className="text-slate-400"># Check → HSTS ✓, CSP ✓, X-Frame-Options ✗ (missing)</div>

                <div className="mt-2"><span className="text-emerald-300">$</span> nmap -p 22,80,443 --script=banner target.local</div>
                <div className="text-slate-400">PORT   STATE SERVICE VERSION</div>
                <div className="text-slate-400">22/tcp open  ssh     OpenSSH 8.4</div>
                <div className="text-slate-400">80/tcp open  http    nginx 1.20</div>
                <div className="text-slate-400">443/tcp open https   tls/openssl 1.1.1</div>
                <div className="text-slate-400"># Next → Review XFO policy and TLS settings</div>

                <div className="mt-2 typing-caret"><span className="text-emerald-300">$</span> </div>
              </div>
            </div>
          </div>
        </section>

        
      </main>

      {/* Footer is provided globally in App.jsx */}
    </div>
  );
}

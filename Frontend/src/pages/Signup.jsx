import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { apiUrl } from '../lib/api';
import BrandLogo from "../components/BrandLogo";


export default function Signup() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(apiUrl('/api/auth/v1/signup'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Signup successful!");
        navigate("/login");
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#0a0f14] via-[#101a24] to-black text-slate-100 flex flex-col">
      {/* Animated background gradient */}
      <div className="fixed inset-0 -z-10 animate-gradient-move hero-gradient" aria-hidden></div>

      {/* Hero: minimalist, no logo card */}
      <section className="px-6 pt-16 pb-8 sm:pt-24 sm:pb-12">
        <div className="container-narrow">
          <div className="flex flex-col items-center text-center">
            <BrandLogo size={124} withTagline={false} />
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight max-w-2xl">
              Create your account and start learning.
            </h1>
            <p className="mt-4 text-slate-400 text-lg max-w-2xl">
              Hands-on courses, measurable progress, and skill-first certifications.
            </p>
          </div>
        </div>
      </section>

      {/* Signup card, centered below hero */}
      <section className="px-4 pb-12">
        <div className="max-w-md mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-7 shadow-lg neon-card">
            <div className="absolute inset-0 blur-3xl opacity-30 pointer-events-none" aria-hidden>
              <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.15),transparent_35%)]" />
            </div>
            <form onSubmit={handleSubmit} className="relative space-y-5">
              <div className="text-center mb-2">
                <h2 className="text-2xl font-bold text-slate-100 mb-1">Create Account</h2>
                <p className="text-slate-400 text-sm">Join MS Academy today</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 placeholder:text-slate-500 text-slate-100 focus:outline-none focus:ring-0 focus:border-emerald-400/50"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 placeholder:text-slate-500 text-slate-100 focus:outline-none focus:ring-0 focus:border-emerald-400/50"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 placeholder:text-slate-500 text-slate-100 focus:outline-none focus:ring-0 focus:border-emerald-400/50"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a strong password"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mx-auto text-emerald-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Create Account'
                )}
              </button>
              <div className="text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-emerald-300 hover:text-emerald-200">Sign in</Link>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { apiUrl } from '../lib/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (values) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(apiUrl('/api/auth/v1/login'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      if (!data.token) {
        throw new Error("No token received");
      }

      // Store the token
      localStorage.setItem("token", data.token);

      // Now fetch the user details
      const userResponse = await fetch(apiUrl('/api/auth/v1/me'), {
        headers: {
          "Authorization": `Bearer ${data.token}`,
          "Content-Type": "application/json"
        }
      });

      if (!userResponse.ok) {
        throw new Error("Failed to fetch user details");
      }

      const userData = await userResponse.json();
      
      // Store user data in localStorage
      localStorage.setItem("user", JSON.stringify(userData.user));

      // Check admin status with proper type checking
      if (userData.user && userData.user.is_admin === true) {
        toast.success("Welcome Admin!");
        navigate("/admin/dashboard");
      } else {
        toast.success("Welcome back!");
        navigate("/dashboard");
      }

    } catch (error) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin({
      email: formData.email,
      password: formData.password,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black py-12 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3">
            <img
              src="/logo.png"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.svg'; }}
              alt="Logo"
              className="h-48 w-48 rounded-[25px] object-cover shrink-0"
            />
          </div>
          <div className="mt-2 text-[10px] text-slate-500">Managed by Hackosquad</div>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-6">
          <div className="absolute inset-0 blur-3xl opacity-30 pointer-events-none" aria-hidden>
            <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_35%),radial-gradient(circle_at_80%_30%,rgba(16,185,129,0.15),transparent_35%)]" />
          </div>

          <div className="relative">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h2>
              <p className="text-slate-400 text-sm">Sign in to continue</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded border border-red-400/30 bg-red-500/10 text-red-200 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-slate-400 mb-1">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 placeholder:text-slate-500 text-slate-100 focus:outline-none focus:ring-0 focus:border-emerald-400/50"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="w-full px-3 py-2 rounded-md bg-black/30 border border-white/10 placeholder:text-slate-500 text-slate-100 focus:outline-none focus:ring-0 focus:border-emerald-400/50"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-slate-400">
                  <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded bg-black/30 border-white/10" />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-xs text-emerald-300 hover:text-emerald-200">Forgot password?</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mx-auto text-emerald-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Sign in'
                )}
              </button>

              <div className="text-center text-xs text-slate-500">
                <span className="mr-1">Don’t have an account?</span>
                <Link to="/signup" className="text-emerald-300 hover:text-emerald-200">Create an account</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

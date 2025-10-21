import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { apiUrl } from '../lib/api';
import {
  UserCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

        const response = await fetch(apiUrl('/api/auth/v1/me'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data || {});
      // Fetch purchases in parallel once profile loads
      fetchPurchases();
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      setLoadingPurchases(true);
      const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/payments/mine'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => []);
      if (!res.ok) throw new Error(data?.message || 'Failed to load purchases');
      setPurchases(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Purchases fetch error:', e);
      toast.error(e?.message || 'Failed to load purchases');
    } finally {
      setLoadingPurchases(false);
    }
  };

  const userInfo = useMemo(() => {
    // Support both shapes: { user: {...}, enrolled_courses: [...] } and flat
    if (!profile) return {};
    const u = profile.user || profile;
    return {
      id: u.id,
      email: u.email,
      full_name: u.full_name || u.name || u.email,
      created_at: u.created_at
    };
  }, [profile]);

  const enrolledCourses = useMemo(() => {
    return profile?.enrolled_courses || profile?.enrolledCourses || [];
  }, [profile]);

  const copy = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied');
    } catch {
      toast.error('Failed to copy');
    }
  };

  if (loading) return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
      <Sidebar />
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="neon-card px-6 py-4 rounded-xl border border-white/5 text-slate-200">Loading profile...</div>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
      <Sidebar />
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="px-6 py-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200">{error}</div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Top Navbar */}
          <div className="mb-6 flex items-center justify-between border-b border-emerald-400/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-slate-100">MaxSec Acadmy</span>
              <span className="text-xs text-slate-500">Managed by Hackosquad</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <button onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-emerald-300">Browse</button>
              <button onClick={() => navigate('/my-learning')} className="text-slate-300 hover:text-emerald-300">My Learning</button>
            </div>
          </div>

          {/* Profile panel */}
          <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#0c1217]">
            <div className="px-6 py-8 border-b border-white/10">
              <div className="flex items-center">
                <UserCircleIcon className="h-16 w-16 text-emerald-300" />
                <div className="ml-5">
                  <h2 className="text-2xl font-bold text-slate-100">{userInfo.full_name}</h2>
                  <p className="text-slate-400 text-sm">Member since {userInfo.created_at ? new Date(userInfo.created_at).toLocaleDateString() : '-'}</p>
                  <p className="text-slate-400 text-xs">{userInfo.email}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
              <StatsCard icon={AcademicCapIcon} title="Total Courses" value={profile.total_courses ?? (enrolledCourses?.length || 0)} />
              <StatsCard icon={ChartBarIcon} title="Average Progress" value={`${profile.average_progress ?? 0}%`} />
              <StatsCard icon={CalendarIcon} title="Last Active" value={new Date().toLocaleDateString()} />
            </div>

            {/* Course Progress */}
            <div className="p-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-slate-100 mb-4">My Courses</h3>
              <div className="space-y-3">
                {enrolledCourses && enrolledCourses.length > 0 ? (
                  enrolledCourses.map(course => (
                    <div
                      key={course.id}
                      className="bg-white/5 rounded-lg p-4 border border-white/10 hover:bg-white/10 transition cursor-pointer"
                      onClick={() => navigate(`/courses/${course.id}/learn`)}
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-slate-100 truncate">{course.title}</h4>
                          <div className="mt-2 w-full bg-black/30 rounded h-2">
                            <div
                              className="bg-emerald-400 h-2 rounded"
                              style={{ width: `${course.progress ?? 0}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{course.progress ?? 0}% Complete</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">No enrolled courses yet.</div>
                )}
              </div>
            </div>

            {/* Purchase History */}
            <div className="p-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-100">Purchase History</h3>
                <button onClick={fetchPurchases} className="px-3 py-1.5 rounded-md bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10 text-xs">Refresh</button>
              </div>
              {loadingPurchases ? (
                <div className="text-sm text-slate-400">Loading purchases…</div>
              ) : purchases.length === 0 ? (
                <div className="text-sm text-slate-400">No purchases yet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {purchases.map(p => (
                    <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex gap-4 min-h-[110px]">
                      <img src={p.course_thumbnail || '/placeholder-course.png'} alt="course" className="w-24 h-16 md:w-28 md:h-20 object-cover rounded" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm md:text-base font-medium text-slate-100 truncate" title={p.course_title || p.course_id}>{p.course_title || p.course_id}</h4>
                          <span className={`px-2 py-0.5 text-[11px] rounded-full border ${
                            p.status === 'approved' ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' :
                            p.status === 'rejected' ? 'bg-red-500/15 text-red-200 border-red-400/30' :
                            'bg-amber-500/15 text-amber-200 border-amber-400/30'
                          }`}>{p.status}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          <span>Amount: </span><span className="text-slate-200">₹{p.amount ?? '-'}</span>
                          <span className="ml-2">• </span>
                          <span>{new Date(p.created_at).toLocaleString()}</span>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono tracking-wide truncate" title={p.transaction_id || p.receipt_email}>{p.transaction_id || p.receipt_email || '—'}</span>
                          {(p.transaction_id || p.receipt_email) && (
                            <button className="px-2 py-0.5 rounded bg-white/10 border border-white/10 hover:bg-white/20 text-[10px]" onClick={() => copy(p.transaction_id || p.receipt_email)}>Copy</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, title, value }) => (
  <div className="bg-white/5 rounded-xl p-5 border border-white/10">
    <div className="flex items-center">
      <Icon className="h-7 w-7 text-emerald-300" />
      <div className="ml-4">
        <p className="text-xs font-medium text-slate-400">{title}</p>
        <p className="text-xl font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  </div>
);

export default UserProfile;
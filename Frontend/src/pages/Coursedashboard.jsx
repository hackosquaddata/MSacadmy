import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { supabase } from '../lib/supabaseClient';

export default function CourseDashboard() {
  const [courses, setCourses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch all courses from Supabase directly
        const { data, error } = await supabase.from('courses').select('*');
        if (error) throw error;
        setCourses(data || []);
        setFiltered(data || []);
      } catch (err) {
        setError(err.message || "Something went wrong while fetching courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
    // fetch current user to get enrolled courses and profile
    const fetchMe = async () => {
      try {
        const res = await fetch(apiUrl('/api/auth/v1/me'), {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        setMe(data);
        const enrolledIds = (data.enrolled_courses || []).map(c => c.id);
        setEnrolledCourses(enrolledIds);
      } catch (err) {
        console.error('Failed to fetch current user:', err);
      }
    };
    fetchMe();
  }, []);

  // client-side filtering
  useEffect(() => {
    const q = query.toLowerCase().trim();
    const next = courses.filter(c => {
      const matchQ = !q || (c.title?.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
      const catVal = (c.category || '').toLowerCase();
      const matchCat = category === 'all' || catVal === category;
      return matchQ && matchCat;
    });
    setFiltered(next);
  }, [query, category, courses]);

  // sorting
  const [sortBy, setSortBy] = useState('relevance');
  const filteredSorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case 'price-asc':
        return arr.sort((a,b) => (a.price||0) - (b.price||0));
      case 'price-desc':
        return arr.sort((a,b) => (b.price||0) - (a.price||0));
      case 'duration-desc':
        return arr.sort((a,b) => (b.duration||0) - (a.duration||0));
      case 'newest':
        return arr.sort((a,b) => new Date(b.created_at||0) - new Date(a.created_at||0));
      default:
        return arr; // relevance
    }
  }, [filtered, sortBy]);

  // Payment modal replaced with two-step checkout page

  const handleEnroll = async (courseId) => {
    // If already enrolled, go to course content
    if (enrolledCourses.includes(courseId)) {
      navigate(`/courses/${courseId}/learn`);
      return;
    }
    // New flow: go directly to checkout step 1
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first');
      localStorage.setItem('redirectAfterLogin', `/checkout/${courseId}`);
      navigate('/login');
      return;
    }
    navigate(`/checkout/${courseId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-slate-100">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="neon-card px-6 py-4 rounded-xl border border-white/5 text-slate-200">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
        {/* Top Navbar */}
        <div className="mb-6 flex items-center justify-between border-b border-emerald-400/10 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="font-semibold text-slate-100">MaxSec Acadmy</span>
            <span className="text-xs text-slate-500">Managed by Hackosquad</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {me && <span className="text-slate-400">Hi, <span className="text-slate-200 font-medium">{(me.full_name || me.email || '').split(' ')[0]}</span></span>}
            <button onClick={() => navigate('/my-learning')} className="text-slate-300 hover:text-emerald-300">My Learning</button>
            <button onClick={() => navigate('/profile')} className="text-slate-300 hover:text-emerald-300">Profile</button>
          </div>
        </div>
        {/* Hero/Header */}
        <div className="mb-8">
          <div className="relative overflow-hidden rounded-2xl bg-[#0c1217] border border-white/10">
            <div className="absolute inset-0 blur-3xl opacity-30" aria-hidden>
              <div className="h-full w-full bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.25),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.15),transparent_35%)]" />
            </div>
            <div className="relative px-6 py-8 md:px-10 md:py-10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs uppercase tracking-wider text-emerald-200">
                    <SparklesIcon className="h-4 w-4 text-emerald-300" />
                    MaxSec Acadmy
                  </div>
                  <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">
                    <span className="text-slate-100">Courses</span>
                  </h1>
                </div>
                <div className="hidden md:flex items-center gap-2 self-start">
                  <div className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs text-slate-300 capitalize">Category: {category}</div>
                  <div className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs text-slate-300">{filtered.length} matching</div>
                  <button onClick={() => navigate('/my-learning')} className="px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 text-xs">My Learning</button>
                </div>
              </div>

              {/* Search and toolbar */}
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <MagnifyingGlassIcon className="h-5 w-5 text-emerald-300 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search courses..."
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/30 border border-white/10 focus:border-emerald-400/50 focus:ring-0 outline-none placeholder:text-slate-400 text-slate-100"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="bg-black/30 border border-white/10 text-slate-200 rounded px-3 py-2 text-sm capitalize"
                  >
                    <option value="all">All categories</option>
                    <option value="red teamer">Red Teamer</option>
                    <option value="blue teamer">Blue Teamer</option>
                    <option value="forensics">Forensics</option>
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="bg-black/30 border border-white/10 text-slate-200 rounded px-3 py-2 text-sm">
                    <option value="relevance">Sort: Relevance</option>
                    <option value="newest">Newest</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="duration-desc">Duration</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          </div>
        </div>

        

        {/* Continue Learning (enrolled) */}
        {enrolledCourses.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-100">Continue learning</h2>
              <button onClick={() => navigate('/my-learning')} className="text-sm text-emerald-300 hover:text-emerald-200">View all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.filter(c => enrolledCourses.includes(c.id)).slice(0,6).map(c => (
                <div key={c.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <img src={c.thumbnail} alt={c.title} className="h-16 w-24 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-100 truncate">{c.title}</div>
                    <div className="mt-2 h-2 w-full bg-black/30 rounded">
                      <div className="h-2 bg-emerald-400 rounded" style={{ width: '30%' }} />
                    </div>
                  </div>
                  <button onClick={() => navigate(`/courses/${c.id}/learn`)} className="px-3 py-1.5 text-xs rounded bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25">Resume</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200">
            {error}
          </div>
        )}

        {/* Results count */}
        <div className="mb-4 text-sm text-slate-400">{filteredSorted.length} results</div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSorted.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
              isEnrolled={enrolledCourses.includes(course.id)}
            />
          ))}
        </div>

        {/* Recommended (compact) */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-100">Recommended</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.filter(c => !enrolledCourses.includes(c.id)).slice(0,3).map(course => (
              <CourseCard
                key={`rec-${course.id}`}
                course={course}
                onEnroll={handleEnroll}
                isEnrolled={false}
              />
            ))}
          </div>
        </div>

        {/* Announcements / Help (compact) */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-100 mb-2">Announcements</div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 bg-emerald-400 rounded-full" /> New Forensics module dropping Friday.</li>
              <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 bg-emerald-400 rounded-full" /> Blue teamer live lab maintenance on Sunday 2 AM IST.</li>
            </ul>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="text-sm font-medium text-slate-100 mb-2">Need help?</div>
            <div className="text-sm text-slate-300">Visit <button onClick={() => navigate('/profile')} className="text-emerald-300 hover:text-emerald-200 underline">Profile</button> or email <a className="text-emerald-300 hover:text-emerald-200" href="mailto:support@maxsec.acadmy">support@maxsec.acadmy</a>.</div>
          </div>
        </div>

        {/* Payment modal removed; using two-step checkout page */}
        </div>
      </div>
    </div>
  );
}

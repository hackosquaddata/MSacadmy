import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { apiUrl } from '../lib/api';

export default function MyLearning() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(apiUrl('/api/auth/v1/enrolled-courses'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch enrolled courses');
      }

      console.log('Enrolled courses data:', data);
      setEnrolledCourses(data);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/courses/${courseId}/learn`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
        <Sidebar />
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="neon-card px-6 py-4 rounded-xl border border-white/5 text-slate-200">Loading your courses...</div>
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
              <button onClick={() => navigate('/dashboard')} className="text-slate-300 hover:text-emerald-300">Browse</button>
              <button onClick={() => navigate('/profile')} className="text-slate-300 hover:text-emerald-300">Profile</button>
            </div>
          </div>

          {/* Header */}
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
                      My Learning
                    </div>
                    <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight">
                      <span className="text-slate-100">Your enrolled courses</span>
                    </h1>
                  </div>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            </div>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">
                <SparklesIcon className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="mt-4 text-xl text-slate-300">No enrollments yet</h3>
              <p className="text-sm text-slate-500">Browse courses and start learning today.</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-6 px-5 py-2.5 bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 rounded-lg text-sm"
              >
                Browse Courses
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => (
                <div key={course.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  {course.thumbnail && (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-slate-100 mb-1 line-clamp-1">{course.title}</h3>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{course.description}</p>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-black/30 rounded">
                        <div className="h-2 bg-emerald-400 rounded" style={{ width: `${course.progress ? Math.round(course.progress) : 0}%` }} />
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{course.progress ? `${Math.round(course.progress)}% Complete` : 'Just Started'}</span>
                        <button
                          onClick={() => handleContinueLearning(course.id)}
                          className="px-3 py-1.5 rounded bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25 text-xs"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
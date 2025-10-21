import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import { apiUrl } from '../lib/api';
import { SparklesIcon, AcademicCapIcon, ClockIcon, TagIcon, PlayIcon, DocumentIcon } from '@heroicons/react/24/outline';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  // const [enrolling, setEnrolling] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  // Payment modal removed in favor of two-step checkout page
  const [previewModules, setPreviewModules] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
    // Check if we need to trigger enrollment after login
    const shouldEnroll = localStorage.getItem("enrollAfterLogin");
    if (shouldEnroll) {
      localStorage.removeItem("enrollAfterLogin");
      handlePay();
    }

    // Check if user already has access to this course
    const checkAccess = async () => {
      try {
        const res = await fetch(apiUrl(`/api/courses/${courseId}/access`), {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
        }
      } catch (err) {
        console.error('Access check failed:', err);
      }
    };
    checkAccess();
    fetchPreview();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(apiUrl(`/api/courses/${courseId}`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        console.error('Failed to load course details', response.status, err);
        toast.error(err.message || 'Failed to load course details');
        setCourse(null);
        return;
      }
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    navigate(`/checkout/${courseId}`);
  };

  // Fetch curriculum preview (uses admin contents endpoint; falls back gracefully if unauthorized)
  const fetchPreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/admin/courses/${courseId}/contents`), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        // Likely unauthorized for non-admin; silently ignore to avoid noise
        setPreviewModules([]);
        return;
      }
      const data = await res.json(); // [{ module_name, contents: [...] }]
      // Keep only preview lessons and trim to a small set
      const modulesWithPreviews = data
        .map(m => ({
          name: m.module_name,
          lessons: (m.contents || []).filter(c => c.is_preview),
        }))
        .filter(m => m.lessons.length > 0)
        .slice(0, 3);
      // Limit each module to up to 3 preview lessons
      const trimmed = modulesWithPreviews.map(m => ({
        name: m.name,
        lessons: m.lessons.slice(0, 3),
      }));
      setPreviewModules(trimmed);
    } catch (err) {
      console.error('Preview fetch failed:', err);
      setPreviewError('');
    } finally {
      setPreviewLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
        <div className="neon-card px-6 py-4 rounded-xl border border-white/5 text-slate-200">Loading course...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
        <Sidebar />
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Course not found</h2>
            <p className="text-slate-400 mb-4">We couldn't find the course you requested. It may have been removed.</p>
            <button onClick={() => navigate('/dashboard')} className="px-4 py-2 bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 rounded hover:bg-emerald-500/25">Back to courses</button>
          </div>
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
              <button onClick={() => navigate('/my-learning')} className="text-slate-300 hover:text-emerald-300">My Learning</button>
            </div>
          </div>

          {/* Hero */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0c1217] border border-white/10">
            <div className="absolute inset-0 blur-3xl opacity-30" aria-hidden>
              <div className="h-full w-full bg-[radial-gradient(circle_at_15%_20%,rgba(16,185,129,0.25),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.15),transparent_35%)]" />
            </div>
            <div className="relative px-6 py-8 md:px-10 md:py-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                <div className="md:col-span-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-xs uppercase tracking-wider text-emerald-200">
                    <SparklesIcon className="h-4 w-4 text-emerald-300" />
                    Course
                  </div>
                  <h1 className="mt-3 text-3xl md:text-4xl font-extrabold leading-tight text-slate-100">{course.title}</h1>
                  <div className="mt-2 text-sm text-slate-400">Provided by <span className="text-slate-200">{course.created_by || 'MS Academy'}</span></div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {course.category && (
                      <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs text-slate-300 capitalize">{course.category}</span>
                    )}
                    {course.duration && (
                      <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs text-slate-300 flex items-center gap-1">
                        <ClockIcon className="h-4 w-4 text-emerald-300" /> {course.duration} hrs
                      </span>
                    )}
                    <span className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-xs text-slate-300 flex items-center gap-1">
                      <TagIcon className="h-4 w-4 text-emerald-300" /> ₹{course.price}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    {hasAccess ? (
                      <button onClick={() => navigate(`/courses/${courseId}/learn`)} className="px-5 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25">
                        Continue Learning
                      </button>
                    ) : (
                      <button onClick={handlePay} className="px-5 py-2.5 rounded-lg bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25">
                        Enroll Now
                      </button>
                    )}
                    <div className="text-xs text-slate-400">Manual verification • Support available</div>
                  </div>
                </div>

                <div className="md:col-span-1 space-y-4">
                  <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                    <img src={course.thumbnail || '/placeholder-course.png'} alt={course.title} className="w-full h-48 object-cover" />
                    <div className="p-4 border-t border-white/10">
                      <div className="text-sm text-slate-400">Price</div>
                      <div className="text-2xl font-bold text-slate-100">₹{course.price}</div>
                    </div>
                  </div>
                  {course.certification_preview && (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/30">
                      <img src={course.certification_preview} alt="Certification preview" className="w-full h-40 object-cover" />
                      <div className="p-3 border-t border-white/10 text-xs text-slate-400">Certification preview</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
          </div>

          {/* What you'll learn */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">What you'll learn</h3>
              <ul className="space-y-2 text-sm text-slate-300 list-disc list-inside">
                {(Array.isArray(course.objectives) ? course.objectives : []).slice(0,6).map((o, idx) => (
                  <li key={idx}>{o}</li>
                ))}
                {(!course.objectives || course.objectives.length === 0) && (
                  <li className="text-slate-500">Course objectives will be added soon.</li>
                )}
              </ul>
            </div>
            <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Overview</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2"><AcademicCapIcon className="h-5 w-5 text-emerald-300" /> Category: <span className="capitalize text-slate-200">{course.category || '—'}</span></div>
                <div className="flex items-center gap-2"><ClockIcon className="h-5 w-5 text-emerald-300" /> Duration: <span className="text-slate-200">{course.duration ? `${course.duration} hrs` : '—'}</span></div>
                <div className="flex items-center gap-2"><TagIcon className="h-5 w-5 text-emerald-300" /> Price: <span className="text-slate-200">₹{course.price}</span></div>
              </div>
            </div>
          </div>

          {/* Curriculum preview */}
          {(previewModules.length > 0 || previewLoading) && (
            <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-100">Curriculum preview</h3>
                <span className="text-xs text-slate-500">Preview lessons only</span>
              </div>
              {previewLoading ? (
                <div className="text-sm text-slate-400">Loading preview...</div>
              ) : (
                <div className="space-y-4">
                  {previewModules.map((m, i) => (
                    <div key={i} className="">
                      <div className="text-sm font-medium text-slate-200 mb-2">{m.name}</div>
                      <div className="space-y-2">
                        {m.lessons.map(lesson => (
                          <div key={lesson.id} className="flex items-center justify-between p-3 bg-black/30 border border-white/10 rounded-lg">
                            <div className="flex items-center gap-3 min-w-0">
                              {lesson.file_type === 'video' ? (
                                <PlayIcon className="h-5 w-5 text-emerald-300" />
                              ) : (
                                <DocumentIcon className="h-5 w-5 text-emerald-300" />
                              )}
                              <div className="min-w-0">
                                <div className="text-sm text-slate-100 truncate">{lesson.lesson_title}</div>
                                <div className="text-xs text-slate-500">{lesson.file_type} • Preview</div>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 text-[11px]">Preview</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Included in this course + Instructor */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">Included in this course</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  'Lifetime access',
                  'Certificate of completion',
                  'Community support',
                ].map((chip, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-full bg-black/30 border border-white/10 text-sm text-slate-300">{chip}</span>
                ))}
              </div>
            </div>
            <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-3">{Array.isArray(course.instructors) && course.instructors.length > 1 ? 'Instructors' : 'Instructor'}</h3>
              {Array.isArray(course.instructors) && course.instructors.length > 0 ? (
                <div className="space-y-3">
                  {course.instructors.map((name, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 flex items-center justify-center text-sm">
                        {name?.[0] || 'M'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-100 capitalize">{name}</div>
                        <div className="text-xs text-slate-500">MaxSec Acadmy</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 flex items-center justify-center text-sm">
                    {(course.created_by || 'MS')[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-100">{course.created_by || 'MaxSec Instructor'}</div>
                    <div className="text-xs text-slate-500">MaxSec Acadmy</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment modal replaced by the two-step checkout page */}
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
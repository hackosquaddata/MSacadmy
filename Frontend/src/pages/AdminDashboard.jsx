import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { apiUrl } from '../lib/api';
import {
  PlusIcon,
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  FolderOpenIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: "₹0",
    activeUsers: 0
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrollmentsModalOpen, setEnrollmentsModalOpen] = useState(false);
  const [selectedCourseEnrollments, setSelectedCourseEnrollments] = useState([]);
  const [selectedCourseTitle, setSelectedCourseTitle] = useState('');
  const [couponStats, setCouponStats] = useState({});

  const token = localStorage.getItem("token");

  // Fetch courses and stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await fetch(apiUrl('/api/admin/courses'), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        // Fetch stats
        const statsResponse = await fetch(apiUrl('/api/admin/dashboard/stats'), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        // Coupon stats (admin-only)
        const couponRes = await fetch(apiUrl('/api/payments/coupons/stats'), {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!coursesResponse.ok || !statsResponse.ok || !couponRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const coursesData = await coursesResponse.json();
        const statsData = await statsResponse.json();
        const couponData = await couponRes.json();

        setCourses(coursesData);
        setStats({
          totalCourses: coursesData.length,
          totalStudents: statsData.totalStudents,
          totalRevenue: `₹${statsData.totalRevenue}`,
          activeUsers: statsData.totalStudents // Using same number for active users
        });
        setCouponStats(couponData.stats || {});
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (token) fetchDashboardData();
  }, [token]);

  // Delete course
  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    setLoading(true);
    try {
      const response = await fetch(apiUrl(`/api/admin/courses/${courseId}`), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // pass token
        },
      });

      if (!response.ok) throw new Error("Failed to delete course");

      setCourses(prev => prev.filter(course => course.id !== courseId));
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course. Make sure you are logged in as admin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Admin Dashboard">
      {/* Coupon usage chips */}
      {couponStats && Object.keys(couponStats).length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {Object.entries(couponStats).map(([code, count]) => (
            <span key={code} className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-emerald-500/10 border border-emerald-400/30 text-emerald-200">
              <span className="font-semibold">{code}</span>
              <span className="opacity-80">{count}</span>
            </span>
          ))}
          <button
            onClick={() => navigate('/admin/coupons')}
            className="ml-2 px-3 py-1.5 rounded-lg text-xs bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10"
          >View details</button>
        </div>
      )}
      {/* Stat cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[{
          label: 'Total Courses',
          value: stats.totalCourses,
          Icon: AcademicCapIcon,
          color: 'from-emerald-600/15 to-emerald-400/10',
          ring: 'ring-emerald-400/40'
        },{
          label: 'Total Students',
          value: stats.totalStudents,
          Icon: UsersIcon,
          color: 'from-emerald-600/15 to-emerald-400/10',
          ring: 'ring-emerald-400/40'
        },{
          label: 'Total Revenue',
          value: stats.totalRevenue,
          Icon: ChartBarIcon,
          color: 'from-emerald-600/15 to-emerald-400/10',
          ring: 'ring-emerald-400/40'
        },{
          label: 'Active Users',
          value: stats.activeUsers,
          Icon: UsersIcon,
          color: 'from-emerald-600/15 to-emerald-400/10',
          ring: 'ring-emerald-400/40'
        }].map((card, i) => (
          <div key={i} className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${card.color} p-5 ring-1 ${card.ring}`}>
            <card.Icon className="h-6 w-6 text-white/70" />
            <div className="mt-3 text-2xl font-bold text-white">{card.value}</div>
            <div className="text-sm text-white/70">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Courses table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl mt-6 overflow-hidden">
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-white font-semibold">Courses</h2>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/help')}
              className="px-3 py-2 text-sm rounded-lg bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10"
            >Help Desk</button>
            <button
              onClick={() => navigate('/admin/manual-payments')}
              className="px-3 py-2 text-sm rounded-lg bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/25"
            >Manual Payments</button>
            <button
              onClick={() => navigate('/admin/create-course')}
              className="px-3 py-2 text-sm rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25"
            >Create Course</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-300">
                <th className="px-6 py-3">Course</th>
                <th className="px-6 py-3">Price</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {courses.map((course) => (
                <tr key={course.id} className="text-slate-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {course.thumbnail && (
                        <img 
                          src={course.thumbnail} 
                          alt={course.title}
                          className="h-10 w-10 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">{course.title}</div>
                        <div className="text-xs text-slate-400">{course.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">₹{course.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{course.duration || 'N/A'} hrs</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${
                      course.status === 'active' 
                        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30' 
                        : 'bg-yellow-500/15 text-yellow-200 border-yellow-400/30'
                    }`}>
                      {course.status || 'inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => navigate(`/admin/course/${course.id}/content`)}
                        className="px-3 py-1.5 rounded-md bg-emerald-500/15 text-emerald-200 border border-emerald-400/30 hover:bg-emerald-500/25"
                        title="Manage Course Content"
                      >
                        <FolderOpenIcon className="h-4 w-4 inline-block mr-1" />
                        Content
                      </button>

                      <button
                        onClick={async () => {
                          setSelectedCourseTitle(course.title);
                          setEnrollmentsModalOpen(true);
                          try {
                            const res = await fetch(apiUrl(`/api/admin/courses/${course.id}/enrollments`), {
                              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                            });
                            if (!res.ok) throw new Error('Failed to fetch enrollments');
                            const data = await res.json();
                            setSelectedCourseEnrollments(data);
                          } catch (err) {
                            console.error('Failed to load enrollments:', err);
                            toast.error('Failed to load enrollments');
                          }
                        }}
                        className="px-3 py-1.5 rounded-md bg-indigo-500/15 text-indigo-200 border border-indigo-400/30 hover:bg-indigo-500/25"
                      >
                        Enrollments
                      </button>

                      <button
                        onClick={() => navigate(`/admin/courses/${course.id}/upload`)}
                        className="px-3 py-1.5 rounded-md bg-cyan-500/15 text-cyan-200 border border-cyan-400/30 hover:bg-cyan-500/25"
                        title="Upload Course Content"
                      >
                        <CloudArrowUpIcon className="h-4 w-4 inline-block mr-1" />
                        Upload
                      </button>

                      <button 
                        onClick={() => navigate(`/admin/course/${course.id}/edit`)}
                        className="px-3 py-1.5 rounded-md bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="px-3 py-1.5 rounded-md bg-red-500/15 text-red-200 border border-red-400/30 hover:bg-red-500/25"
                        disabled={loading}
                      >
                        {loading ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {courses.length === 0 && (
            <div className="text-center py-12 text-slate-300">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-slate-500" />
              <h3 className="mt-2 text-sm font-medium text-white">No courses</h3>
              <p className="mt-1 text-sm text-slate-400">Get started by creating a new course.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/admin/create-course')}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-emerald-200 bg-emerald-500/20 border border-emerald-400/30 hover:bg-emerald-500/25"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Course
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/admin/create-course')}
          className="neon-card flex items-center justify-center px-4 py-3 rounded-xl text-emerald-200 border border-emerald-400/20 hover:bg-emerald-500/10"
        >
          <PlusIcon className="h-6 w-6 mr-2" />
          Create New Course
        </button>
        <button
          onClick={() => {
            if (courses.length > 0) navigate(`/admin/course/${courses[0].id}/content`);
            else toast('Create a course first');
          }}
          className="neon-card flex items-center justify-center px-4 py-3 rounded-xl text-cyan-200 border border-cyan-400/20 hover:bg-cyan-500/10"
        >
          <CloudArrowUpIcon className="h-6 w-6 mr-2" />
          Upload Content
        </button>
        <button
          onClick={() => toast('Analytics coming soon')}
          className="neon-card flex items-center justify-center px-4 py-3 rounded-xl text-fuchsia-200 border border-fuchsia-400/20 hover:bg-fuchsia-500/10"
        >
          <ChartBarIcon className="h-6 w-6 mr-2" />
          View Analytics
        </button>
      </div>

      {/* Enrollments modal */}
      {enrollmentsModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-11/12 max-w-3xl rounded-2xl border border-white/10 bg-slate-900 text-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold">Enrollments • {selectedCourseTitle}</h3>
              <button onClick={() => setEnrollmentsModalOpen(false)} className="text-slate-400 hover:text-white">Close</button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-4">
              {selectedCourseEnrollments.length === 0 ? (
                <div className="text-center text-slate-400 py-6">No enrollments</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead className="text-left text-slate-300">
                    <tr>
                      <th className="px-4 py-2">User</th>
                      <th className="px-4 py-2">Email</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {selectedCourseEnrollments.map(en => (
                      <tr key={en.id}>
                        <td className="px-4 py-2">{en.user?.full_name || en.user_id}</td>
                        <td className="px-4 py-2">{en.user?.email || '-'}</td>
                        <td className="px-4 py-2">{en.status}</td>
                        <td className="px-4 py-2">
                          <button className="px-3 py-1.5 rounded-md bg-red-500/15 text-red-200 border border-red-400/30 hover:bg-red-500/25" onClick={async () => {
                            if (!confirm('Revoke enrollment?')) return;
                            try {
                              const res = await fetch(apiUrl(`/api/admin/enrollments/${en.id}`), {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                              });
                              if (!res.ok) throw new Error('Failed to revoke');
                              setSelectedCourseEnrollments(prev => prev.filter(x => x.id !== en.id));
                              toast.success('Enrollment revoked');
                            } catch (err) {
                              console.error('Revoke error:', err);
                              toast.error('Failed to revoke enrollment');
                            }
                          }}>Revoke</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
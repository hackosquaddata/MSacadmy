import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  UsersIcon,
  AcademicCapIcon,
  ChartBarIcon,
  FolderOpenIcon,
  CloudArrowUpIcon,
  ArrowLeftOnRectangleIcon // Add this import
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast'; // Import toast

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

  const token = localStorage.getItem("token"); // ✅ read token from localStorage

  // Fetch courses and stats
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await fetch("http://localhost:3000/api/admin/courses", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        // Fetch stats
        const statsResponse = await fetch("http://localhost:3000/api/admin/dashboard/stats", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!coursesResponse.ok || !statsResponse.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const coursesData = await coursesResponse.json();
        const statsData = await statsResponse.json();

        setCourses(coursesData);
        setStats({
          totalCourses: coursesData.length,
          totalStudents: statsData.totalStudents,
          totalRevenue: `₹${statsData.totalRevenue}`,
          activeUsers: statsData.totalStudents // Using same number for active users
        });
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
      const response = await fetch(`http://localhost:3000/api/admin/courses/${courseId}`, {
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

  // Add sign out handler
  const handleSignOut = () => {
    // Clear all auth-related data
    localStorage.clear();
    // Show success message
    toast.success('Signed out successfully');
    // Redirect to login page
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - Updated with sign out button */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin/create-course')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Course
              </button>

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <AcademicCapIcon className="h-6 w-6 text-gray-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Courses</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalCourses}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <UsersIcon className="h-6 w-6 text-gray-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalStudents}</dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5 flex items-center">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalRevenue}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Courses</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Course Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courses.map((course) => (
                      <tr key={course.id}>
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
                              <div className="text-sm font-medium text-gray-900">{course.title}</div>
                              <div className="text-sm text-gray-500">{course.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{course.price}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{course.duration || 'N/A'} hrs</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            course.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {course.status || "inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            {/* Manage Content Button */}
                            <button
                              onClick={() => navigate(`/admin/course/${course.id}/content`)}
                              className="inline-flex items-center px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-md text-sm font-medium transition-colors"
                              title="Manage Course Content"
                            >
                              <FolderOpenIcon className="h-4 w-4 mr-1.5" />
                              Content
                            </button>

                            {/* Upload Content Button */}
                            <button
                              onClick={() => navigate(`/admin/courses/${course.id}/upload`)}
                              className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md text-sm font-medium transition-colors"
                              title="Upload Course Content"
                            >
                              <CloudArrowUpIcon className="h-4 w-4 mr-1.5" />
                              Upload
                            </button>

                            {/* Edit Button */}
                            <button 
                              onClick={() => navigate(`/admin/course/${course.id}/edit`)}
                              className="text-indigo-600 hover:text-indigo-900 font-medium"
                            >
                              Edit
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteCourse(course.id)}
                              className="text-red-600 hover:text-red-900 font-medium"
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
                  <div className="text-center py-12">
                    <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No courses</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/admin/create-course')}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Create Course
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => navigate('/admin/create-course')}
                  className="flex items-center justify-center px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-6 w-6 mr-2" />
                  Create New Course
                </button>
                
                <button
                  onClick={() => {
                    // Navigate to first available course's content page, or show a selection modal
                    if (courses.length > 0) {
                      navigate(`/admin/course/${courses[0].id}/content`);
                    } else {
                      alert('Please create a course first');
                    }
                  }}
                  className="flex items-center justify-center px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                >
                  <CloudArrowUpIcon className="h-6 w-6 mr-2" />
                  Upload Content
                </button>
                
                <button
                  onClick={() => {
                    // Add analytics/reports navigation here
                    alert('Analytics feature coming soon!');
                  }}
                  className="flex items-center justify-center px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
                >
                  <ChartBarIcon className="h-6 w-6 mr-2" />
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
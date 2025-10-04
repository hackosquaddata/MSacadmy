import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  ClockIcon,
  ChartBarIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const UserProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

      const response = await fetch('http://localhost:3000/api/auth/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      setProfile(data);
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="text-red-600">{error}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b bg-gradient-to-r from-primary-600 to-secondary-600">
            <div className="flex items-center">
              <UserCircleIcon className="h-20 w-20 text-white" />
              <div className="ml-6">
                <h2 className="text-3xl font-bold text-white">{profile.full_name}</h2>
                <p className="text-primary-100">Member since {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <StatsCard 
              icon={AcademicCapIcon} 
              title="Total Courses" 
              value={profile.total_courses} 
            />
            <StatsCard 
              icon={ChartBarIcon} 
              title="Average Progress" 
              value={`${profile.average_progress}%`} 
            />
            <StatsCard 
              icon={CalendarIcon} 
              title="Last Active" 
              value={new Date().toLocaleDateString()} 
            />
          </div>

          {/* Course Progress */}
          <div className="p-6 border-t">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">My Courses</h3>
            <div className="space-y-4">
              {profile.enrolled_courses.map(course => (
                <div 
                  key={course.id} 
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition cursor-pointer"
                  onClick={() => navigate(`/courses/${course.id}/learn`)}
                >
                  <div className="flex items-center space-x-4">
                    <img 
                      src={course.thumbnail} 
                      alt={course.title} 
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900">{course.title}</h4>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{course.progress}% Complete</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ icon: Icon, title, value }) => (
  <div className="bg-gray-50 rounded-xl p-6">
    <div className="flex items-center">
      <Icon className="h-8 w-8 text-primary-500" />
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default UserProfile;
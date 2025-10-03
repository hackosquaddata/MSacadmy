import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  AcademicCapIcon,
  ClockIcon
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
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch user profile
      const userResponse = await fetch('http://localhost:3000/api/auth/v1/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Failed to fetch profile');
      }

      const userData = await userResponse.json();

      // Fetch enrolled courses
      const coursesResponse = await fetch('http://localhost:3000/api/auth/v1/enrolled-courses', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      let enrolledCourses = [];
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        enrolledCourses = coursesData.courses || [];
      }

      setProfile({
        ...userData,
        enrolled_courses: enrolledCourses
      });
    } catch (error) {
      setError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Profile Header */}
          <div className="px-4 py-5 sm:px-6 border-b">
            <div className="flex items-center">
              <UserCircleIcon className="h-16 w-16 text-gray-400" />
              <div className="ml-4">
                <h2 className="text-2xl font-bold text-gray-900">{profile?.fullname || profile?.username}</h2>
                <p className="text-sm text-gray-500">Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="flex items-center">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-base text-gray-900">{profile?.email}</p>
                </div>
              </div>

              <div className="flex items-center">
                <AcademicCapIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Enrolled Courses</p>
                  <p className="text-base text-gray-900">{profile?.enrolled_courses?.length || 0} courses</p>
                  <div className="mt-2">
                    {profile?.enrolled_courses?.map((course) => (
                      <div key={course.id} className="mb-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm font-medium">{course.title}</p>
                        {course.progress !== undefined && (
                          <div className="mt-1 w-full bg-gray-200 rounded h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded" 
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Learning Progress</p>
                  <div className="mt-1">
                    {profile?.enrolled_courses?.map((course) => (
                      <div key={course.id} className="mb-2">
                        <p className="text-sm text-gray-900">{course.title}</p>
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded" 
                            style={{ width: `${course.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';

export default function CourseDashboard() {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const navigate = useNavigate();

  // Fetch courses from backend
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:3000/api/auth/v1/courses", {
          method:"GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          setCourses(data);
        } else {
          setError(data.error || "Failed to fetch courses");
        }
      } catch (err) {
        setError("Something went wrong while fetching courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      console.log('Starting enrollment process for course:', courseId);
      setEnrolling(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        localStorage.setItem('redirectAfterLogin', `/courses/${courseId}`);
        navigate('/login');
        return;
      }

      console.log('Token found:', token.substring(0, 20) + '...'); // Debug log
      
      const response = await fetch(`http://localhost:3000/api/payments/create-session/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Payment session response status:', response.status);
      const data = await response.json();
      console.log('Payment session response:', data);

      if (!response.ok) {
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem('token');
          toast.error('Session expired. Please login again');
          navigate('/login');
          return;
        }
        throw new Error(data.message || 'Failed to create payment session');
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "MS Academy",
        description: data.course_name,
        order_id: data.id,
        prefill: {
          name: data.user_name,
          email: data.user_email
        },
        handler: async function(response) {
          try {
            const verifyResponse = await fetch('http://localhost:3000/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              toast.success('Payment successful!');
              navigate(`/courses/${courseId}/learn`);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        theme: {
          color: "#3B82F6"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Enrollment error:', error);
      toast.error(error.message || 'Failed to initiate enrollment');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 p-8">
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
          <p className="mt-2 text-gray-600">Explore our latest courses and start learning today</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onEnroll={handleEnroll}
              isEnrolled={enrolledCourses.includes(course.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

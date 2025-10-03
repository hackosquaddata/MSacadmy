import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetails();
    // Check if we need to trigger enrollment after login
    const shouldEnroll = localStorage.getItem("enrollAfterLogin");
    if (shouldEnroll) {
      localStorage.removeItem("enrollAfterLogin");
      handleEnroll();
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`http://localhost:3000/api/payments/create-session/${courseId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Payment session data:', data);

      if (!response.ok) {
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
              toast.success('Successfully enrolled in the course!');
              navigate(`/courses/${courseId}/learn`);
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
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Course details UI */}
      <button
        onClick={handleEnroll}
        disabled={enrolling}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {enrolling ? 'Processing...' : 'Enroll Now'}
      </button>
    </div>
  );
};

export default CourseDetails;
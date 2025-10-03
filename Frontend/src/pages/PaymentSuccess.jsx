// Frontend/src/pages/PaymentSuccess.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const courseId = searchParams.get('courseId');
    toast.success('Payment successful!');
    setTimeout(() => {
      navigate(`/courses/${courseId}/learn`);
    }, 2000);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600">
          Redirecting you to your course...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
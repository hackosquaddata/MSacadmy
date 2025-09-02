import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import CourseCard from '../components/CourseCard';

export default function CourseDashboard() {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Sample course data (replace with API call)
  useEffect(() => {
    // Simulated course data
    const sampleCourses = [
      {
        id: 1,
        title: "Complete Web Development Bootcamp",
        description: "Learn HTML, CSS, JavaScript, React, Node.js and more. Build real-world projects and deploy them.",
        thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800",
        category: "Web Development",
        duration: "40 hours",
        price: 4999,
        rating: 4.8,
        enrolledCount: 1234,
        instructor: "John Doe"
      },
      {
        id: 2,
        title: "Python for Data Science",
        description: "Master Python programming with focus on data analysis, visualization, and machine learning concepts.",
        thumbnail: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800",
        category: "Data Science",
        duration: "35 hours",
        price: 3999,
        rating: 4.9,
        enrolledCount: 892,
        instructor: "Jane Smith"
      },
      {
        id: 3,
        title: "Mobile App Development",
        description: "Create iOS and Android apps using React Native. Learn app deployment and publishing.",
        thumbnail: "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800",
        category: "Mobile Development",
        duration: "38 hours",
        price: 4499,
        rating: 4.7,
        enrolledCount: 756,
        instructor: "Mike Johnson"
      }
    ];

    setCourses(sampleCourses);
    setLoading(false);
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      // Add your enrollment logic here
      // This should connect to your backend API
      console.log(`Enrolling in course: ${courseId}`);
    } catch (error) {
      setError('Failed to enroll in the course. Please try again.');
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
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  StarIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  // Simulated course data (replace with API call)
  useEffect(() => {
    // This would be your API call
    const fetchCourse = async () => {
      try {
        // Simulated course data
        const courseData = {
          id: courseId,
          title: "Complete Web Development Bootcamp",
          description: "Learn HTML, CSS, JavaScript, React, Node.js and more. Build real-world projects and deploy them.",
          thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800",
          category: "Web Development",
          duration: "40 hours",
          price: 4999,
          rating: 4.8,
          enrolledCount: 1234,
          instructor: {
            name: "John Doe",
            title: "Senior Web Developer",
            image: "https://ui-avatars.com/api/?name=John+Doe",
            bio: "10+ years of experience in web development and teaching"
          },
          learningOutcomes: [
            "Master HTML5, CSS3, and modern JavaScript",
            "Build full-stack applications with React and Node.js",
            "Understand database design and implementation",
            "Deploy applications to production",
            "Create responsive and accessible web designs"
          ],
          prerequisites: [
            "Basic computer knowledge",
            "No prior programming experience needed",
            "Willingness to learn and practice"
          ],
          curriculum: [
            {
              title: "Introduction to Web Development",
              lessons: ["Web Fundamentals", "How the Internet Works", "Development Environment Setup"]
            },
            {
              title: "HTML & CSS Fundamentals",
              lessons: ["HTML Structure", "CSS Styling", "Responsive Design"]
            },
            {
              title: "JavaScript Programming",
              lessons: ["JavaScript Basics", "DOM Manipulation", "Async Programming"]
            }
          ]
        };

        setCourse(courseData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching course:', error);
        navigate('/dashboard');
      }
    };

    fetchCourse();
  }, [courseId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleEnroll = async () => {
    // Add enrollment logic here
    console.log('Enrolling in course:', courseId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Course Header */}
      <div className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-2 text-sm mb-4">
                <span className="bg-blue-500 px-2 py-1 rounded">{course.category}</span>
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  <span className="ml-1">{course.rating}</span>
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-4">{course.title}</h1>
              <p className="text-gray-300 mb-6">{course.description}</p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  {course.duration}
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 mr-2" />
                  {course.enrolledCount} students
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <img 
                src={course.thumbnail} 
                alt={course.title}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <div className="text-gray-900 text-3xl font-bold mb-4">
                ₹{course.price}
              </div>
              <button
                onClick={handleEnroll}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors mb-4"
              >
                Enroll Now
              </button>
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-2">
                  <ClockIcon className="h-5 w-5 mr-2" />
                  Full lifetime access
                </div>
                <div className="flex items-center mb-2">
                  <AcademicCapIcon className="h-5 w-5 mr-2" />
                  Certificate of completion
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Learning Outcomes */}
            <section>
              <h2 className="text-2xl font-bold mb-4">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" />
                    <span>{outcome}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Prerequisites */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Prerequisites</h2>
              <ul className="list-disc list-inside space-y-2">
                {course.prerequisites.map((prerequisite, index) => (
                  <li key={index}>{prerequisite}</li>
                ))}
              </ul>
            </section>

            {/* Curriculum */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Course Curriculum</h2>
              <div className="space-y-4">
                {course.curriculum.map((section, index) => (
                  <div key={index} className="border rounded-lg">
                    <div className="p-4 bg-gray-50 font-semibold border-b">
                      {section.title}
                    </div>
                    <ul className="p-4 space-y-2">
                      {section.lessons.map((lesson, lessonIndex) => (
                        <li key={lessonIndex} className="flex items-center">
                          <PlayIcon className="h-5 w-5 text-gray-400 mr-2" />
                          {lesson}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Instructor */}
          <div>
            <section className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Instructor</h2>
              <div className="flex items-center mb-4">
                <img 
                  src={course.instructor.image}
                  alt={course.instructor.name}
                  className="h-16 w-16 rounded-full mr-4"
                />
                <div>
                  <h3 className="font-semibold">{course.instructor.name}</h3>
                  <p className="text-gray-600">{course.instructor.title}</p>
                </div>
              </div>
              <p className="text-gray-600">{course.instructor.bio}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
import {
  StarIcon,
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';

export default function CourseCard({ course, onEnroll, isEnrolled }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/course/${course.id}`);
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <img 
        src={course.thumbnail} 
        alt={course.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
            {course.category}
          </span>
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <span className="ml-1 text-gray-600">{course.rating}</span>
          </div>
        </div>
        
        <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center mb-4">
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            {course.duration}
          </div>
          <div className="flex items-center text-sm text-gray-500 ml-4">
            <UserGroupIcon className="h-4 w-4 mr-1" />
            {course.enrolledCount} students
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">₹{course.price}</div>
          <button
            onClick={() => onEnroll(course.id)}
            className={`px-4 py-2 rounded-lg ${
              isEnrolled
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white transition-colors`}
          >
            {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
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
      className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-emerald-400/30 hover:shadow-[0_0_14px_rgba(16,185,129,0.12)] transition-all duration-300 cursor-pointer"
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={course.thumbnail} 
          alt={course.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <span className="absolute top-3 left-3 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded border border-emerald-400/30 capitalize">
          {course.category || 'general'}
        </span>
      </div>
      <div className="p-5 text-slate-200">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <span className="ml-1 text-slate-400">{course.rating || '4.8'}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-1 text-slate-100 line-clamp-1">{course.title}</h3>
        <p className="text-slate-400 text-sm mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex items-center mb-4 text-slate-400">
          <div className="flex items-center text-sm">
            <ClockIcon className="h-4 w-4 mr-1 text-slate-500" />
            {course.duration ? `${course.duration} hrs` : 'Duration N/A'}
          </div>
          <div className="flex items-center text-sm ml-4">
            <UserGroupIcon className="h-4 w-4 mr-1 text-slate-500" />
            {course.enrolledCount || 0} students
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xl font-bold text-slate-100">₹{course.price}</div>
          <button
            onClick={(e) => { e.stopPropagation(); onEnroll(course.id); }}
            className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
              isEnrolled
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40 hover:bg-emerald-500/25'
                : 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40 hover:bg-indigo-500/25'
            }`}
          >
            {isEnrolled ? 'Continue Learning' : 'Enroll Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowLeftOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleSignOut = () => {
    // Clear all auth-related data
    localStorage.clear(); // This will remove token and any other stored data
    
    // Show success message
    toast.success('Signed out successfully');
    
    // Force redirect to login page
    window.location.href = '/login'; // Using window.location for a full page refresh
  };

  const navigation = [
    { name: 'Available Courses', href: '/dashboard', icon: BookOpenIcon },
    { name: 'My Learning', href: '/my-learning', icon: AcademicCapIcon },
    { name: 'Profile', href: '/profile', icon: UserCircleIcon },
  ];

  return (
    <div className={`bg-gray-900 text-white transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 flex items-center justify-between">
        {isOpen ? (
          <h1 className="text-xl font-bold">MS Academy</h1>
        ) : (
          <span className="text-xl font-bold">MS</span>
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="text-white">
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>
      <nav className="mt-8">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center py-3 px-4 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors
              ${location.pathname === item.href ? 'bg-gray-800 text-white' : ''}`}
          >
            <item.icon className="w-6 h-6" />
            {isOpen && <span className="ml-3">{item.name}</span>}
          </Link>
        ))}
      </nav>
      
      {/* Sign Out Button */}
      <div className="mt-auto p-4">
        <button
          onClick={handleSignOut}
          className="flex items-center w-full px-4 py-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 mr-3" />
          {isOpen && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ChartBarIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Sidebar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);

  const navigation = [
    { name: 'Available Courses', href: '/dashboard', icon: BookOpenIcon },
    { name: 'My Learning', href: '/dashboard/enrolled', icon: AcademicCapIcon },
    { name: 'Progress', href: '/dashboard/progress', icon: ChartBarIcon },
    { name: 'Assignments', href: '/dashboard/assignments', icon: ClipboardDocumentListIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
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
    </div>
  );
}
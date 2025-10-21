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

  // Lightweight user info for avatar/initials
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const displayName = user?.full_name || user?.email || 'User';
  const initials = (displayName?.match(/\b\w/g) || []).slice(0,2).join('').toUpperCase();

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
    { name: 'Support', href: '/support', icon: ClipboardDocumentListIcon },
  ];

  return (
    <div className={`hidden md:flex h-screen sticky top-0 self-start flex-col bg-[#0b0f14] text-slate-200 border-r border-white/10 transition-[width] duration-200 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 flex items-center justify-between border-b border-white/10">
        {isOpen ? (
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.svg'; }}
              alt="Logo"
              className="h-20 w-20 rounded-[25px] object-cover shrink-0"
            />
            <div className="leading-tight">
              <div className="text-[10px] text-slate-500">Managed by Hackosquad</div>
            </div>
          </div>
        ) : (
          <img
            src="/logo.png"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/logo.svg'; }}
            alt="Logo"
            className="h-14 w-14 rounded-[25px] object-cover shrink-0"
          />
        )}
        <button onClick={() => setIsOpen(!isOpen)} className="text-slate-400 hover:text-slate-200">
          {isOpen ? (
            <XMarkIcon className="w-5 h-5" />
          ) : (
            <Bars3Icon className="w-5 h-5" />
          )}
        </button>
      </div>
      {/* User mini card */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-200 flex items-center justify-center text-xs">
              {initials || 'U'}
            </div>
          )}
          {isOpen && (
            <div className="min-w-0">
              <div className="text-sm font-medium truncate text-slate-100">{displayName}</div>
              <div className="text-[11px] text-slate-500 truncate">{user?.email || 'Account'}</div>
            </div>
          )}
        </div>
      </div>
      {/* Section heading */}
      {isOpen && (
        <div className="px-4 pt-3 text-[10px] uppercase tracking-wider text-slate-500">Menu</div>
      )}
      <nav className="py-2 flex-1 overflow-y-auto">
        {navigation.map((item) => {
          const active = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              title={!isOpen ? item.name : undefined}
              className={`group flex items-center gap-3 py-2.5 px-4 text-sm border-l-2 ${active ? 'text-emerald-200 bg-emerald-500/10 border-emerald-400/50' : 'text-slate-300 hover:bg-white/5 hover:text-white border-transparent'}`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-emerald-300' : 'text-slate-400 group-hover:text-white'}`} />
              {isOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 bg-[#0b0f14]/95">
        <div className={`flex ${isOpen ? 'gap-2' : 'flex-col gap-2 items-center'}`}>
          {user?.is_admin && (
            <button
              onClick={() => navigate('/admin/help')}
              className="flex items-center justify-center w-full px-3 py-2 text-slate-200 bg-black/30 border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-sm"
              title={!isOpen ? 'Help Desk' : undefined}
            >
              <ChartBarIcon className="h-5 w-5 mr-2 text-slate-400" />
              {isOpen && <span>Help Desk</span>}
            </button>
          )}
          {user?.is_admin && (
            <button
              onClick={() => navigate('/admin/coupons')}
              className="mt-2 flex items-center justify-center w-full px-3 py-2 text-slate-200 bg-black/30 border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-sm"
              title={!isOpen ? 'Coupon Usage' : undefined}
            >
              <ChartBarIcon className="h-5 w-5 mr-2 text-slate-400" />
              {isOpen && <span>Coupon Usage</span>}
            </button>
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center w-full px-3 py-2 text-emerald-200 bg-black/30 border border-white/10 hover:bg-white/10 rounded-lg transition-colors text-sm"
            title={!isOpen ? 'Sign Out' : undefined}
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-2 text-emerald-300" />
            {isOpen && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
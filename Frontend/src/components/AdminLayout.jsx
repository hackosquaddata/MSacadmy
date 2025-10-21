import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bars3Icon, HomeIcon, CurrencyDollarIcon, PlusCircleIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

function AdminLayout({ children, title = 'Admin' }) {
	const navigate = useNavigate();
	const location = useLocation();

	const handleSignOut = () => {
		localStorage.clear();
		toast.success('Signed out');
		navigate('/login');
	};

	const navItems = [
		{ to: '/admin/dashboard', label: 'Dashboard', Icon: HomeIcon },
		{ to: '/admin/manual-payments', label: 'Manual Payments', Icon: CurrencyDollarIcon },
		{ to: '/admin/create-course', label: 'Create Course', Icon: PlusCircleIcon },
		{ to: '/admin/courses/upload', label: 'Upload Content', Icon: InboxArrowDownIcon },
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#0a0f14] via-[#0a0f14] to-black text-slate-100">
			{/* Header */}
			<div className="sticky top-0 z-30 bg-[#0a0f14]/90 backdrop-blur border-b border-white/10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-14">
						<div className="flex items-center gap-3">
							<button className="p-2 rounded-md hover:bg-white/5"><Bars3Icon className="h-5 w-5 text-slate-300" /></button>
							<div className="leading-tight">
								<div className="flex items-center gap-2">
									<span className="text-base font-semibold text-emerald-300">MaxSec Acadmy</span>
									<span className="text-[10px] text-slate-500">Managed by Hackosquad</span>
								</div>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="hidden sm:flex sm:items-center sm:space-x-3">
								<span className="text-xs text-slate-400">Administrator</span>
								<button onClick={() => navigate('/dashboard')} className="text-xs text-slate-400 hover:text-emerald-300">View Site</button>
							</div>
							<button onClick={handleSignOut} className="px-3 py-1 rounded-md text-emerald-200 bg-emerald-500/15 border border-emerald-400/30 hover:bg-emerald-500/25 text-xs">Sign out</button>
						</div>
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div className="grid grid-cols-1 md:grid-cols-6 gap-6">
					<aside className="md:col-span-1 bg-[#0b0f14] rounded-lg border border-white/10 p-4 sticky top-20 h-fit">
						<nav className="space-y-1">
							{navItems.map(({ to, label, Icon }) => {
								const active = location.pathname === to;
								return (
									<Link
										key={to}
										to={to}
										className={`flex items-center gap-3 p-2 rounded-md text-sm border ${active ? 'bg-emerald-500/10 text-emerald-200 border-emerald-400/30' : 'text-slate-300 hover:bg-white/5 hover:text-white border-transparent'}`}
									>
										<Icon className={`h-5 w-5 ${active ? 'text-emerald-300' : 'text-slate-400'}`} /> {label}
									</Link>
								);
							})}
						</nav>
					</aside>

					<main className="md:col-span-5">
						<div className="mb-4">
							<h1 className="text-xl font-semibold text-slate-100">{title}</h1>
						</div>
						<div className="space-y-6">{children}</div>
					</main>
				</div>
			</div>
		</div>
	);
}

export default AdminLayout;

import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import BottomNav from '../components/layout/BottomNav';
import {
  HiHome, HiUsers, HiClipboardList, HiChartBar, HiCog,
} from 'react-icons/hi';

const sideNavItems = [
  { to: '/dashboard', icon: HiHome, label: 'Dashboard' },
  { to: '/workers', icon: HiUsers, label: 'Workers' },
  { to: '/attendance', icon: HiClipboardList, label: 'Attendance' },
  { to: '/reports', icon: HiChartBar, label: 'Reports' },
  { to: '/settings', icon: HiCog, label: 'Settings' },
];

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 shrink-0">
          <nav className="flex-1 px-3 py-4 space-y-1">
            {sideNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="px-3 py-4 border-t border-gray-100">
            <div className="text-xs text-gray-400 text-center">WorkerPay v1.0</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
    </div>
  );
}

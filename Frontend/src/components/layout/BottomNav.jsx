import { NavLink } from 'react-router-dom';
import {
  HiHome,
  HiUsers,
  HiClipboardList,
  HiChartBar,
  HiCog,
} from 'react-icons/hi';

const navItems = [
  { to: '/dashboard', icon: HiHome, label: 'Home' },
  { to: '/workers', icon: HiUsers, label: 'Workers' },
  { to: '/attendance', icon: HiClipboardList, label: 'Attendance' },
  { to: '/reports', icon: HiChartBar, label: 'Reports' },
  { to: '/settings', icon: HiCog, label: 'Settings' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-nav md:hidden pb-safe">
      <div className="flex items-center h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center h-full gap-0.5 transition-colors ${
                isActive ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'bg-primary-50 scale-110' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-primary-600' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  MapPin,
  FileBarChart2,
  LogOut,
  HardHat,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/workers', label: 'Workers', icon: Users },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck },
  { to: '/payroll', label: 'Payroll Report', icon: FileBarChart2 },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <HardHat size={22} color="white" />
        </div>
        <h1>WorkerPay</h1>
        <p>Attendance & Payroll</p>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="user-info">
            <div className="user-avatar">
              {user.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
            </div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

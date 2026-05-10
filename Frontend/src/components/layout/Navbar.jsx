import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiMenuAlt2, HiChevronDown, HiUser, HiLogout, HiLocationMarker } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar({ onMenuClick }) {
  const { user, locations, activeLocation, setActiveLocation, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const profileRef = useRef(null);
  const locationRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (locationRef.current && !locationRef.current.contains(e.target)) setShowLocations(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch {
      toast.error('Logout failed');
    }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center h-16 px-4 gap-3">
        {/* Hamburger (for potential sidebar use) */}
        <button
          onClick={onMenuClick}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors text-gray-600 md:hidden"
          aria-label="Menu"
        >
          <HiMenuAlt2 className="w-5 h-5" />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">WP</span>
          </div>
          <span className="font-bold text-gray-900 text-base truncate hidden sm:block">WorkerPay</span>
        </div>

        {/* Location Selector */}
        <div className="relative" ref={locationRef}>
          <button
            onClick={() => setShowLocations(!showLocations)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 hover:bg-primary-100 transition-colors text-primary-700 text-sm font-medium max-w-[150px]"
          >
            <HiLocationMarker className="w-4 h-4 flex-shrink-0 text-primary-500" />
            <span className="truncate">
              {activeLocation?.name || 'Select Location'}
            </span>
            <HiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${showLocations ? 'rotate-180' : ''}`} />
          </button>

          {showLocations && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                Locations
              </div>
              {locations.length === 0 && (
                <div className="px-4 py-3 text-sm text-gray-500">No locations yet</div>
              )}
              {locations.map((loc) => (
                <button
                  key={loc._id}
                  onClick={() => {
                    setActiveLocation(loc);
                    setShowLocations(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                    activeLocation?._id === loc._id ? 'text-primary-600 font-semibold bg-primary-50' : 'text-gray-700'
                  }`}
                >
                  <HiLocationMarker className="w-4 h-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{loc.name}</div>
                    {loc.address && <div className="text-xs text-gray-400 truncate">{loc.address}</div>}
                  </div>
                </button>
              ))}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => { navigate('/settings'); setShowLocations(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-primary-600 hover:bg-primary-50 transition-colors font-medium"
                >
                  + Manage Locations
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 hover:shadow-md transition-shadow"
            aria-label="Profile"
          >
            {initials}
          </button>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { navigate('/settings'); setShowProfile(false); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HiUser className="w-4 h-4 text-gray-400" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <HiLogout className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

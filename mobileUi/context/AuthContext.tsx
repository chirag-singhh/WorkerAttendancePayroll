import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authService } from '../services/authService';
import { locationService } from '../services/locationService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [activeLocation, setActiveLocation] = useState(null);

  // Restore session on mount
  useEffect(() => {
    authService.me()
      .then((res) => {
        setUser(res.data.user || res.data);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch locations when user is set
  const fetchLocations = useCallback(async () => {
    if (!user) return;
    try {
      const res = await locationService.getAll();
      const locs = res.data.locations || res.data || [];
      setLocations(locs);
      
      // Try to load saved location from SecureStore
      const savedLocationId = await SecureStore.getItemAsync('activeLocationId');
      if (savedLocationId) {
        const found = locs.find(l => l._id === savedLocationId);
        if (found) {
          setActiveLocation(found);
          return;
        }
      }

      // Auto-select first location if none selected
      if (!activeLocation && locs.length > 0) {
        setActiveLocation(locs[0]);
      }
    } catch {
      // ignore
    }
  }, [user, activeLocation]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSetActiveLocation = async (loc) => {
    setActiveLocation(loc);
    if (loc) {
      await SecureStore.setItemAsync('activeLocationId', loc._id);
    } else {
      await SecureStore.deleteItemAsync('activeLocationId');
    }
  };

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const userData = res.data.user || res.data;
    setUser(userData);
    return userData;
  };

  const register = async (name, email, password) => {
    const res = await authService.register({ name, email, password });
    return res.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore
    }
    setUser(null);
    setActiveLocation(null);
    setLocations([]);
    await SecureStore.deleteItemAsync('activeLocationId');
  };

  const value = {
    user,
    loading,
    locations,
    activeLocation,
    setActiveLocation: handleSetActiveLocation,
    fetchLocations,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

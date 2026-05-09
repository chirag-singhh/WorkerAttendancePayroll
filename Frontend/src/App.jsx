import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Locations from './pages/Locations';
import Workers from './pages/Workers';
import Attendance from './pages/Attendance';
import Payroll from './pages/Payroll';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/payroll" element={<Payroll />} />
        </Routes>
      </main>
    </div>
  );
}

function AuthGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AuthGuard />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a2540',
              color: '#f1f5f9',
              border: '1px solid rgba(99,130,255,0.2)',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#10b981', secondary: '#111827' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#111827' } },
          }}
        />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

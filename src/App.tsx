import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme, lightTheme } from './theme/theme';
import { useThemeMode } from './hooks/useThemeMode';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import MFAPage from './pages/MFAPage';
import AccessDeniedPage from './pages/AccessDeniedPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import ManagerDashboard from './pages/ManagerDashboard';
import TeamLeadDashboard from './pages/TeamLeadDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';

function RootRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'hr':
      return <Navigate to="/dashboard" replace />;
    case 'manager':
      return <Navigate to="/manager-dashboard" replace />;
    case 'team_lead':
      return <Navigate to="/team-lead-dashboard" replace />;
    case 'employee':
      return <Navigate to="/employee-dashboard" replace />;
    default:
      return <Navigate to="/dashboard" replace />;
  }
}

function ProtectedLayoutWrapper() {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <Layout onThemeToggle={toggleTheme} isDark={mode === 'dark'}>
      <Outlet />
    </Layout>
  );
}

function AppContent() {
  const { mode } = useThemeMode();
  const theme = mode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/mfa" element={<MFAPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />

        {/* Protected Dashboard Routes sharing uniform Layout */}
        <Route element={<ProtectedLayoutWrapper />}>
          {/* Admin & HR Company-wide Workforce Intelligence */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'hr']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Security & User Role Management Center */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Department Operations Dashboard (Manager Scope) */}
          <Route
            path="/manager-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Team Operations & Velocity Dashboard (Team Lead Scope) */}
          <Route
            path="/team-lead-dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'team_lead']}>
                <TeamLeadDashboard />
              </ProtectedRoute>
            }
          />

          {/* Legacy fallback path */}
          <Route
            path="/team-dashboard"
            element={<Navigate to="/team-lead-dashboard" replace />}
          />

          {/* Personal Employee Workspace */}
          <Route
            path="/employee-dashboard"
            element={
              <ProtectedRoute allowedRoles={['employee', 'admin', 'hr', 'manager', 'team_lead']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Root & Catch-All */}
        <Route path="/" element={<RootRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

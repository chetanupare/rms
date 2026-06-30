import { useState } from 'react';
import { HashRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { BranchProvider } from './context/BranchContext';
import { OfflineProvider } from './context/OfflineContext';
import ToastContainer from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';
import InstallPWA from './components/InstallPWA';
import ProtectedLayout from './components/layout/ProtectedLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Repairs from './pages/Repairs';
import JobDetail from './pages/JobDetail';
import Billing from './pages/Billing';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import DataWarehouse from './pages/DataWarehouse';
import DailyRegistrar from './pages/DailyRegistrar';
import Inventory from './pages/Inventory';
import WarrantyPage from './pages/WarrantyPage';
import NotFound from './pages/NotFound';

function TechnicianRoute({ children }) {
  const { user } = useAuth();
  if ((user?.role || '').toLowerCase() === 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if ((user?.role || '').toLowerCase() !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

function App() {
  const [splashDone, setSplashDone] = useState(() => !!window.electronAPI?.isElectron);

  if (!splashDone) return <SplashScreen onComplete={() => setSplashDone(true)} />;

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
        <ToastProvider>
          <OfflineProvider>
          <Router>
            <BranchProvider>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/repairs" element={<Repairs />} />
                <Route path="/billing" element={<AdminRoute><Billing /></AdminRoute>} />
                <Route path="/job/:id" element={<JobDetail />} />
                <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                <Route path="/settings" element={<AdminRoute><Settings /></AdminRoute>} />
                <Route path="/data-warehouse" element={<AdminRoute><DataWarehouse /></AdminRoute>} />
                <Route path="/register" element={<AdminRoute><DailyRegistrar /></AdminRoute>} />
                <Route path="/inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
                <Route path="/warranty" element={<AdminRoute><WarrantyPage /></AdminRoute>} />
              </Route>
              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            </BranchProvider>
          </Router>
          </OfflineProvider>
          <ToastContainer />
          <InstallPWA />
        </ToastProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

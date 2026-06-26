import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppShell from './AppShell';
import LoadingSpinner from '../LoadingSpinner';

export default function ProtectedLayout() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) return <LoadingSpinner text="Initializing..." />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;

  return <AppShell />;
}

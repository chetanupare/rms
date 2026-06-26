import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTrayNavigation } from '../../utils/useTrayNavigation';
import AppShell from './AppShell';
import LoadingSpinner from '../LoadingSpinner';

export default function ProtectedLayout() {
  const { user, initializing } = useAuth();
  const location = useLocation();
  useTrayNavigation();

  if (initializing) return <LoadingSpinner text="Initializing..." />;
  if (!user) return <Navigate to="/" state={{ from: location }} replace />;

  return <AppShell />;
}

import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { profile } = useAuth();

  if (!profile) {
    // Fallback, should be handled by the main ProtectedRoute
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.includes(profile.role)) {
    return <Outlet />;
  }

  // Redirect to dashboard if user is not allowed
  return <Navigate to="/" replace />;
};

export default RoleProtectedRoute;
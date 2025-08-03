import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { useMemo } from 'react';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
}

const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { profile, user } = useAuth();

  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);

  if (!userRole) {
    // This can happen briefly while profile is loading.
    // The main ProtectedRoute already handles the main loading state.
    // If we reach here and there's no role, it's likely an unauthorized state.
    // Redirecting to home is a safe default.
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // Redirect to dashboard if user is not allowed
  return <Navigate to="/" replace />;
};

export default RoleProtectedRoute;
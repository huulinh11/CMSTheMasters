import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface PermissionProtectedRouteProps {
  permissionId: string;
}

const PermissionProtectedRoute = ({ permissionId }: PermissionProtectedRouteProps) => {
  const { permissions, loading } = useAuth();

  if (loading) {
    return null; // Wait for auth state to be determined
  }

  // permissions is guaranteed to be an array by useAuth
  if (permissions.includes(permissionId)) {
    return <Outlet />;
  }

  // If user does not have permission, redirect to dashboard
  return <Navigate to="/" replace />;
};

export default PermissionProtectedRoute;
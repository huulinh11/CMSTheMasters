import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface PermissionProtectedRouteProps {
  permissionId: string;
}

const PermissionProtectedRoute = ({ permissionId }: PermissionProtectedRouteProps) => {
  const { permissions } = useAuth();

  // The router's loader ensures that by the time this component renders,
  // the auth state and permissions are already determined.
  // A loading check is no longer needed here.

  // permissions is guaranteed to be an array by useAuth
  if (permissions.includes(permissionId)) {
    return <Outlet />;
  }

  // If user does not have permission, redirect to dashboard
  return <Navigate to="/" replace />;
};

export default PermissionProtectedRoute;
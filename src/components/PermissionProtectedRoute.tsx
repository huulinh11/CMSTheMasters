import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface PermissionProtectedRouteProps {
  permissionId: string;
}

const PermissionProtectedRoute = ({ permissionId }: PermissionProtectedRouteProps) => {
  const { permissions, loading } = useAuth();

  if (loading) {
    return null; // Chờ AuthContext xác định xong
  }

  if (!permissions) {
    // Nếu không có quyền (có thể là lỗi hoặc đang tải), chuyển hướng an toàn
    return <Navigate to="/" replace />;
  }

  if (permissions.includes(permissionId)) {
    return <Outlet />;
  }

  // Chuyển hướng về trang chủ nếu người dùng không có quyền
  return <Navigate to="/" replace />;
};

export default PermissionProtectedRoute;
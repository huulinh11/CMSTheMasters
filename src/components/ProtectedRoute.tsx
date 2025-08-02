import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from './Layout';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Đang tải...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
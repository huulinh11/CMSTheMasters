import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';
import Layout from './Layout';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  // The main loading state is handled in App.tsx.
  // If we reach this component, loading is already false.
  if (loading) {
    return null; // Render nothing while the auth state is being determined at the top level.
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
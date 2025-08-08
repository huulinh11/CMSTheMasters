import { Outlet } from 'react-router-dom';
import Layout from './Layout';

const ProtectedRoute = () => {
  // The loader in App.tsx now handles the redirection.
  // This component's only job is to provide the main layout.
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default ProtectedRoute;
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

const HomeRedirect = () => {
  const { menuConfig, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && menuConfig.length > 0) {
      const defaultPath = menuConfig[0].to;
      navigate(defaultPath, { replace: true });
    }
  }, [isLoading, menuConfig, navigate]);

  return <LoadingScreen />;
};

export default HomeRedirect;
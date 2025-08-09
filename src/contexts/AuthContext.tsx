import { createContext, useEffect, useContext, ReactNode, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';
import { getPermissionsForRole } from '@/config/permissions';

export type Profile = {
  id: string;
  full_name: string;
  department: string;
  role: 'Admin' | 'Quản lý' | 'Nhân viên' | 'Sale';
};

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  permissions: string[];
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession: Session | null;
  initialUser: User | null;
  initialProfile: Profile | null;
}

// AuthProvider giờ đây không còn state riêng. Nó lấy dữ liệu trực tiếp từ props
// được cung cấp bởi loader, đảm bảo chỉ có một nguồn sự thật duy nhất.
export const AuthProvider = ({ children, initialSession, initialUser, initialProfile }: AuthProviderProps) => {
  const navigate = useNavigate();

  // Listener này chỉ dùng để xử lý các sự kiện bất đồng bộ xảy ra SAU khi trang đã tải,
  // ví dụ như người dùng đăng xuất từ một tab khác. Nó không quản lý state.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Nếu session không còn, nghĩa là người dùng đã đăng xuất.
      if (event === 'SIGNED_OUT' || !session) {
        // Chuyển hướng về trang đăng nhập.
        navigate('/login', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const permissions = useMemo(() => {
    const role = initialProfile?.role || initialUser?.user_metadata?.role;
    return getPermissionsForRole(role);
  }, [initialProfile, initialUser]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(`Sign out error: ${error.message}`);
    }
    // Listener ở trên sẽ bắt sự kiện SIGNED_OUT và tự động điều hướng.
  };

  // Giá trị của context được lấy thẳng từ props, không qua state.
  const value = {
    session: initialSession,
    user: initialUser,
    profile: initialProfile,
    permissions,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
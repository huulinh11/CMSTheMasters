import { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
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
  loading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Hàm khởi tạo chạy một lần duy nhất để xác định trạng thái ban đầu.
    const initializeSession = async () => {
      try {
        // 1. Lấy phiên hiện tại một cách tường minh.
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        if (initialSession) {
          const currentUser = initialSession.user;
          setSession(initialSession);
          setUser(currentUser);

          // 2. Nếu có người dùng, tải profile của họ.
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          setProfile(profileData);
        }
      } catch (error) {
        console.error("Lỗi trong quá trình khởi tạo session:", error);
        // Xóa trạng thái nếu có lỗi để đảm bảo an toàn
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // 3. QUAN TRỌNG: Luôn luôn gỡ bỏ màn hình tải sau khi quá trình khởi tạo hoàn tất.
        setLoading(false);
      }
    };

    initializeSession();

    // 4. Sau khi khởi tạo xong, thiết lập trình lắng nghe cho các thay đổi trong tương lai.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Logic này chỉ chạy khi người dùng chủ động đăng nhập/đăng xuất.
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // useEffect riêng biệt để tải profile khi user thay đổi (sau lần tải đầu).
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.error("Lỗi tải profile khi user thay đổi:", error);
            setProfile(null);
          } else {
            setProfile(data);
          }
        });
    } else {
      setProfile(null);
    }
  }, [user]);

  const permissions = useMemo(() => {
    const role = profile?.role || user?.user_metadata?.role;
    return getPermissionsForRole(role);
  }, [profile, user]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      showError(`Sign out error: ${error.message}`);
    } else {
      navigate('/login');
    }
  };

  const value = {
    session,
    user,
    profile,
    permissions,
    loading,
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
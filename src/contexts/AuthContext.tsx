import { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
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
  isLoading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hàm này sẽ chạy một lần khi ứng dụng khởi động để lấy session và profile ban đầu.
    const getInitialSessionAndProfile = async () => {
      try {
        // 1. Lấy session ban đầu.
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        // 2. Nếu có người dùng, tải profile của họ.
        if (initialSession?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialSession.user.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          
          // Cập nhật tất cả state cùng lúc.
          setSession(initialSession);
          setUser(initialSession.user);
          setProfile(userProfile || null);
        }
      } catch (error) {
        console.error("Lỗi trong quá trình tải xác thực ban đầu:", error);
        // Xóa state nếu có lỗi.
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        // 3. Chỉ đặt isLoading thành false sau khi mọi thứ đã hoàn tất.
        setIsLoading(false);
      }
    };

    getInitialSessionAndProfile();

    // 4. Thiết lập listener để theo dõi các thay đổi xác thực trong tương lai (đăng nhập/đăng xuất).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // Nếu người dùng đăng xuất, xóa profile.
      if (!newSession?.user) {
        setProfile(null);
        return;
      }

      // Nếu người dùng đăng nhập hoặc session được làm mới, tải lại profile.
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', newSession.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Lỗi tải profile khi trạng thái xác thực thay đổi:", profileError);
        setProfile(null);
      } else {
        setProfile(userProfile || null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const permissions = useMemo(() => {
    const role = profile?.role || user?.user_metadata?.role;
    return getPermissionsForRole(role);
  }, [profile, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = { session, user, profile, permissions, isLoading, signOut };

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
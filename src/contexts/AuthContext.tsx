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

  // Effect này chỉ chạy một lần duy nhất khi ứng dụng khởi động.
  // Nó sẽ thiết lập listener và kiểm tra session ban đầu.
  useEffect(() => {
    const initializeAndListen = async () => {
      try {
        // 1. Chủ động kiểm tra session ban đầu một lần duy nhất.
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // 3. Thiết lập listener cho các thay đổi trong tương lai.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
        });

        return subscription;
      } catch (error) {
        console.error("Lỗi trong quá trình khởi tạo xác thực:", error);
      } finally {
        // 2. Quan trọng: Luôn tắt màn hình tải sau khi kiểm tra ban đầu hoàn tất.
        setIsLoading(false);
      }
    };

    const subscriptionPromise = initializeAndListen();

    return () => {
      subscriptionPromise.then(sub => sub?.unsubscribe());
    };
  }, []); // Mảng dependency rỗng đảm bảo effect chỉ chạy một lần.

  // Effect này chỉ chịu trách nhiệm tải profile khi có user.
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Lỗi tải profile, đang đăng xuất:", error);
          await supabase.auth.signOut();
          setProfile(null);
        } else {
          setProfile(userProfile || null);
        }
      };
      fetchProfile();
    } else {
      // Nếu không có user, đảm bảo profile cũng là null.
      setProfile(null);
    }
  }, [user]); // Chạy lại mỗi khi đối tượng user thay đổi.

  const permissions = useMemo(() => {
    const role = profile?.role || user?.user_metadata?.role;
    return getPermissionsForRole(role);
  }, [profile, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    // Listener onAuthStateChange sẽ tự động xử lý việc cập nhật state.
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
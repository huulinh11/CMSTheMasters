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
    // Hàm này thực hiện kiểm tra ban đầu và thiết lập listener.
    const initializeAuth = async () => {
      try {
        // 1. Chủ động lấy session hiện tại ngay khi ứng dụng tải.
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Lỗi khi lấy session ban đầu:", sessionError);
        } else if (initialSession) {
          setSession(initialSession);
          const currentUser = initialSession.user;
          setUser(currentUser);

          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Lỗi tải profile khi khởi động, đang đăng xuất:", profileError);
            await supabase.auth.signOut();
          } else {
            setProfile(userProfile || null);
          }
        }
      } catch (e) {
        console.error("Lỗi nghiêm trọng khi khởi tạo auth:", e);
      } finally {
        // 2. Quan trọng nhất: Tắt màn hình tải sau khi kiểm tra ban đầu hoàn tất.
        setIsLoading(false);
      }
    };

    initializeAuth();

    // 3. Bây giờ, mới thiết lập listener cho các thay đổi trong tương lai.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Effect này chỉ chịu trách nhiệm tải profile khi user thay đổi (sau lần tải đầu).
  useEffect(() => {
    if (user && !profile) { // Chỉ fetch nếu chưa có profile
      const fetchProfile = async () => {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error("Lỗi tải profile, đang đăng xuất:", error);
          await supabase.auth.signOut();
        } else {
          setProfile(userProfile || null);
        }
      };
      fetchProfile();
    }
  }, [user, profile]);

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
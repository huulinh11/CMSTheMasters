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
    const initializeAuth = async () => {
      try {
        // Bước 1: Lấy session hiện tại một cách an toàn khi ứng dụng khởi động.
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Bước 2: Nếu có người dùng, lấy profile của họ.
        if (currentUser) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            console.error("Error fetching profile on init:", profileError);
            setProfile(null);
          } else {
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }
      } catch (e) {
        console.error("Error during auth initialization:", e);
        setProfile(null);
        setSession(null);
        setUser(null);
      } finally {
        // Bước 3: Chỉ sau khi tất cả các bước trên hoàn tất, mới tắt màn hình tải.
        setLoading(false);
      }
    };

    initializeAuth();

    // Lắng nghe các thay đổi sau này (đăng nhập/đăng xuất)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const permissions = useMemo(() => getPermissionsForRole(profile?.role), [profile]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      showError(`Sign out error: ${error.message}`);
    } else {
      setProfile(null);
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
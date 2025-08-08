import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';

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
  permissions: string[] | null;
  loading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permissions, setPermissions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const processSession = useCallback(async (session: Session | null) => {
    setSession(session);
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Lỗi khi lấy profile người dùng:", profileError.message);
        setProfile(null);
        setPermissions(null);
        return;
      }
      
      setProfile(profileData);

      if (profileData?.role) {
        const { data: permData, error: permError } = await supabase
          .from('role_permissions')
          .select('permissions')
          .eq('role', profileData.role)
          .single();
        
        if (permError) {
          console.error("Lỗi khi lấy quyền:", permError.message);
          setPermissions([]);
        } else {
          setPermissions(permData?.permissions || []);
        }
      } else {
        setPermissions([]);
      }
    } else {
      setProfile(null);
      setPermissions(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      // Lấy session ban đầu một cách an toàn
      const { data: { session } } = await supabase.auth.getSession();
      await processSession(session);
      // Chỉ tắt màn hình tải sau khi mọi thứ đã sẵn sàng
      setLoading(false);
    };

    initializeAuth();

    // Lắng nghe các thay đổi sau này (đăng nhập/đăng xuất)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      processSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [processSession]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Lỗi khi đăng xuất:", error);
      showError(`Lỗi đăng xuất: ${error.message}`);
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
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

  // useEffect này CHỈ chịu trách nhiệm về trạng thái xác thực (session, user) và trạng thái tải ban đầu.
  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Quan trọng: Gỡ bỏ màn hình tải ngay khi có phiên ban đầu, bất kể có user hay không.
      if (event === 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // useEffect này CHỈ chịu trách nhiệm tải profile khi user thay đổi.
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            console.error("Error fetching profile:", error);
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
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
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
  initialSession: Session | null;
  initialUser: User | null;
  initialProfile: Profile | null;
}

export const AuthProvider = ({ children, initialSession, initialUser, initialProfile }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: userProfile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();
        
        if (error && error.code !== 'PGRST116') {
          showError(`Lỗi tải thông tin người dùng: ${error.message}. Đang đăng xuất...`);
          setProfile(null);
          await supabase.auth.signOut();
        } else {
          setProfile(userProfile || null);
        }
      } else {
        setProfile(null);
      }

      if (_event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const permissions = useMemo(() => {
    const role = profile?.role || user?.user_metadata?.role;
    return getPermissionsForRole(role);
  }, [profile, user]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(`Sign out error: ${error.message}`);
    }
  };

  const value = {
    session,
    user,
    profile,
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
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
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
    const fetchSessionAndProfile = async () => {
      // 1. Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setLoading(false);
        return;
      }

      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // 2. If user exists, get profile
      if (currentUser) {
        try {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError;
          }
          setProfile(userProfile);
        } catch (error) {
          console.warn("Could not fetch user profile:", (error as Error).message);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      // 3. Set loading to false ONLY after all checks are done
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          try {
            const { data: userProfile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', currentUser.id)
              .single();
            if (profileError && profileError.code !== 'PGRST116') throw profileError;
            setProfile(userProfile);
          } catch (error) {
            console.warn("Could not fetch user profile on auth change:", (error as Error).message);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
      showError(`Lỗi đăng xuất: ${error.message}`);
    } else {
      navigate('/login');
    }
  };

  const value = {
    session,
    user,
    profile,
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
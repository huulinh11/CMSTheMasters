import { createContext, useState, useEffect, useContext, ReactNode, useMemo } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { getPermissionsForRole } from '@/config/permissions';
import { allNavItems, NavItemType } from '@/config/nav';

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
  menuConfig: NavItemType[];
  isLoading: boolean;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [menuConfig, setMenuConfig] = useState<NavItemType[]>(allNavItems);

  useEffect(() => {
    const fetchMenuConfig = async () => {
      const { data: menuOrder, error } = await supabase
        .from('menu_config')
        .select('item_id')
        .order('order', { ascending: true });

      if (error) {
        console.error("Error fetching menu config, using default.", error);
        return; // Keep default
      }

      if (menuOrder && menuOrder.length > 0) {
        const orderedItems = menuOrder
          .map(item => allNavItems.find(navItem => navItem.id === item.item_id))
          .filter((item): item is NavItemType => !!item);
        
        // Add any new items from allNavItems that are not in the saved config
        allNavItems.forEach(defaultItem => {
          if (!orderedItems.find(item => item.id === defaultItem.id)) {
            orderedItems.push(defaultItem);
          }
        });
        
        setMenuConfig(orderedItems);
      }
    };

    const initializeAuth = async () => {
      try {
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
        await fetchMenuConfig();
      } catch (e) {
        console.error("Lỗi nghiêm trọng khi khởi tạo auth:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setProfile(null);
      }
      // Refetch menu config on auth change in case it's different
      fetchMenuConfig();
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !profile) {
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

  const value = { session, user, profile, permissions, menuConfig, isLoading, signOut };

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
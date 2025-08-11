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

  const fetchMenuConfig = async (role?: Profile['role']) => {
    let menuOrder: { item_id: string }[] | null = null;
    let error: any = null;

    // 1. Try fetching role-specific config
    if (role) {
      const { data, error: roleError } = await supabase
        .from('menu_config')
        .select('item_id')
        .eq('role', role)
        .order('order', { ascending: true });
      
      if (roleError) {
        console.error(`Error fetching menu config for role ${role}:`, roleError);
      } else if (data && data.length > 0) {
        menuOrder = data;
      }
    }

    // 2. If no role-specific config, fetch default
    if (!menuOrder) {
      const { data, error: defaultError } = await supabase
        .from('menu_config')
        .select('item_id')
        .eq('role', 'default')
        .order('order', { ascending: true });
      
      if (defaultError) {
        error = defaultError;
      } else {
        menuOrder = data;
      }
    }

    if (error) {
      console.error("Error fetching menu config, using default.", error);
      setMenuConfig(allNavItems); // Fallback to hardcoded order
      return;
    }

    if (menuOrder && menuOrder.length > 0) {
      const orderedItems = menuOrder
        .map(item => allNavItems.find(navItem => navItem.id === item.item_id))
        .filter((item): item is NavItemType => !!item);
      
      allNavItems.forEach(defaultItem => {
        if (!orderedItems.find(item => item.id === defaultItem.id)) {
          orderedItems.push(defaultItem);
        }
      });
      
      setMenuConfig(orderedItems);
    } else {
      setMenuConfig(allNavItems); // Fallback if DB is empty
    }
  };

  useEffect(() => {
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
            await fetchMenuConfig(userProfile?.role);
          }
        }
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
        setMenuConfig(allNavItems);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (user && !profile) {
      const fetchProfileAndConfig = async () => {
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
          await fetchMenuConfig(userProfile?.role);
        }
      };
      fetchProfileAndConfig();
    }
  }, [user]);

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
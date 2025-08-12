import { NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { LogOut, LucideIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Sidebar = () => {
  const { signOut, permissions, menuConfig } = useAuth();
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ['checklist_settings_for_sidebar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('checklist_settings')
        .select('sidebar_title')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const navItems = useMemo(() => {
    if (!permissions || !menuConfig) return [];
    return menuConfig.filter(item => permissions.includes(item.id));
  }, [permissions, menuConfig]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 hidden md:flex flex-col">
      <div>
        <div className="font-bold text-2xl text-primary mb-8 px-2">{settings?.sidebar_title || 'EventApp'}</div>
        <nav>
          <ul>
            {navItems.map((item) => (
              <li key={item.to}>
                <NavItem to={item.to} icon={item.icon} label={item.label} end={item.end} />
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="mt-auto">
        <button
          onClick={handleSignOut}
          className="flex items-center p-2 my-1 rounded-lg transition-colors w-full text-slate-600 hover:bg-slate-100"
        >
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="truncate">Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex items-center p-2 my-1 rounded-lg transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-slate-600 hover:bg-slate-100"
      }`
    }
  >
    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
    <span className="truncate">{label}</span>
  </NavLink>
);

export default Sidebar;
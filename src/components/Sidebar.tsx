import { NavLink, useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { LogOut, LucideIcon, ChevronLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
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
    <aside className={cn(
      "relative flex-shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col transition-all duration-300 ease-in-out",
      isCollapsed ? "w-20 p-2" : "w-64 p-4"
    )}>
      <div className="flex-grow">
        <div className={cn(
          "font-bold text-2xl text-primary mb-8 px-2 truncate",
          isCollapsed && "text-center text-lg"
        )}>
          {isCollapsed ? (settings?.sidebar_title || 'E').charAt(0) : (settings?.sidebar_title || 'EventApp')}
        </div>
        <nav>
          <TooltipProvider delayDuration={0}>
            <ul>
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavItem to={item.to} icon={item.icon} label={item.label} end={item.end} isCollapsed={isCollapsed} />
                </li>
              ))}
            </ul>
          </TooltipProvider>
        </nav>
      </div>
      <div className="mt-auto flex-shrink-0">
        <TooltipProvider delayDuration={0}>
          <NavItem to="#" icon={LogOut} label="Đăng xuất" isCollapsed={isCollapsed} onClick={handleSignOut} />
        </TooltipProvider>
      </div>
      <Button
        onClick={onToggle}
        variant="ghost"
        size="icon"
        className="absolute top-1/2 -right-4 transform -translate-y-1/2 bg-white border-2 border-slate-200 rounded-full h-8 w-8 hover:bg-slate-100 z-10"
      >
        <ChevronLeft className={cn("h-5 w-5 transition-transform", isCollapsed && "rotate-180")} />
      </Button>
    </aside>
  );
};

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end, isCollapsed, onClick }) => {
  const content = onClick ? (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center p-2 my-1 rounded-lg transition-colors w-full text-slate-600 hover:bg-slate-100",
        isCollapsed ? "justify-center" : ""
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {!isCollapsed && <span className="ml-3 whitespace-nowrap">{label}</span>}
    </button>
  ) : (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center p-2 my-1 rounded-lg transition-colors w-full",
          isCollapsed ? "justify-center" : "",
          isActive ? "bg-primary/10" : "hover:bg-slate-100"
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={cn(
              "w-5 h-5 flex-shrink-0",
              isActive ? "text-primary" : "text-slate-600"
            )}
          />
          {!isCollapsed && (
            <span
              className={cn(
                "ml-3 whitespace-nowrap",
                isActive ? "text-primary font-semibold" : "text-slate-600"
              )}
            >
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return content;
};

export default Sidebar;
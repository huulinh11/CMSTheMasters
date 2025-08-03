import { NavLink, useLocation } from "react-router-dom";
import { useMemo } from "react";
import { LogOut, LucideIcon, MoreHorizontal } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { allNavItems } from "@/config/nav";

const Sidebar = () => {
  const { signOut, user, profile } = useAuth();
  const location = useLocation();

  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);

  const mainNavItems = useMemo(() => {
    if (!userRole) return [];
    return allNavItems.filter(item => {
      if (item.isMoreLink) return false;
      if (item.roles) {
        return item.roles.includes(userRole);
      }
      return true;
    });
  }, [userRole]);

  const hasVisibleMoreLinks = useMemo(() => {
    if (!userRole) return false;
    return allNavItems.some(item => item.isMoreLink && (!item.roles || item.roles.includes(userRole)));
  }, [userRole]);

  const isMorePageActive = useMemo(() => {
    if (!hasVisibleMoreLinks) return false;
    const morePaths = allNavItems.filter(item => item.isMoreLink).map(item => item.to);
    return morePaths.includes(location.pathname) || location.pathname === '/more';
  }, [location.pathname, hasVisibleMoreLinks]);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 hidden md:flex flex-col">
      <div>
        <div className="font-bold text-2xl text-primary mb-8 px-2">EventApp</div>
        <nav>
          <ul>
            {mainNavItems.map((item) => (
              <li key={item.to}>
                <NavItem to={item.to} icon={item.icon} label={item.label} end={item.end} />
              </li>
            ))}
            {hasVisibleMoreLinks && (
              <li>
                <NavLink
                  to="/more"
                  className={`flex items-center p-2 my-1 rounded-lg transition-colors ${
                    isMorePageActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <MoreHorizontal className="w-5 h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">Khác</span>
                </NavLink>
              </li>
            )}
          </ul>
        </nav>
      </div>
      <div className="mt-auto">
        <button
          onClick={signOut}
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
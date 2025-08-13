import { NavLink, useParams } from "react-router-dom";
import { Home, Calendar, ClipboardList, Megaphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import useGuestNotifications from "@/hooks/useGuestNotifications";

const navItems = [
  { to: "", icon: Home, label: "Home", end: true },
  { to: "/event-info", icon: Calendar, label: "Sự kiện" },
  { to: "/tasks", icon: ClipboardList, label: "Tác vụ" },
  { to: "/benefits", icon: Megaphone, label: "Quyền lợi" },
];

const PublicBottomNav = () => {
  const { identifier } = useParams();
  const { unreadCount } = useGuestNotifications(identifier || null);

  return (
    <footer className="md:relative fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] md:shadow-none flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={`/checklist/${identifier}${item.to}`}
            icon={item.icon}
            label={item.label}
            end={item.end}
            unreadCount={item.label === 'Home' ? unreadCount : 0}
          />
        ))}
      </nav>
    </footer>
  );
};

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  unreadCount?: number;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end, unreadCount = 0 }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full h-full transition-colors ${
        isActive ? "text-primary" : "text-slate-500"
      }`
    }
  >
    <div className="relative">
      <Icon className="w-6 h-6 mb-1" />
      {unreadCount > 0 && (
        <div className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
    <span className="text-xs font-medium">{label}</span>
  </NavLink>
);

export default PublicBottomNav;
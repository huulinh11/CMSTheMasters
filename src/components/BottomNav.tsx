import { NavLink } from "react-router-dom";
import {
  UserCheck,
  Users,
  Megaphone,
  ClipboardList,
  MoreHorizontal,
  LucideIcon,
} from "lucide-react";

const navItems = [
  { to: "/vip-guests", icon: UserCheck, label: "Chức vụ" },
  { to: "/guests", icon: Users, label: "Khách mời" },
  { to: "/media-benefits", icon: Megaphone, label: "Quyền lợi" },
  { to: "/event-tasks", icon: ClipboardList, label: "Tác vụ" },
  { to: "/more", icon: MoreHorizontal, label: "Khác" },
];

const BottomNav = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-1px_10px_rgba(0,0,0,0.05)] md:hidden">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavItem key={item.to} to={item.to} icon={item.icon} label={item.label} />
        ))}
      </nav>
    </footer>
  );
};

interface NavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex flex-col items-center justify-center w-full h-full transition-colors ${
        isActive ? "text-primary" : "text-slate-500"
      }`
    }
  >
    <Icon className="w-6 h-6 mb-1" />
    <span className="text-xs font-medium">{label}</span>
  </NavLink>
);

export default BottomNav;
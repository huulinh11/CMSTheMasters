import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  ClipboardList,
  Info,
  CircleDollarSign,
  CalendarClock,
  UserCircle,
  Settings,
  LucideIcon,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/guests", icon: Users, label: "Khách mời" },
  { to: "/media-benefits", icon: Megaphone, label: "Quyền lợi truyền thông" },
  { to: "/event-tasks", icon: ClipboardList, label: "Tác vụ sự kiện" },
  { to: "/information", icon: Info, label: "Thông tin" },
  { to: "/revenue", icon: CircleDollarSign, label: "Doanh thu" },
  { to: "/timeline", icon: CalendarClock, label: "Timeline" },
  { to: "/account", icon: UserCircle, label: "Tài khoản" },
  { to: "/settings", icon: Settings, label: "Cấu hình" },
];

const Sidebar = () => {
  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 p-4 hidden md:block">
      <div className="font-bold text-2xl text-primary mb-8 px-2">EventApp</div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <NavItem to={item.to} icon={item.icon} label={item.label} />
            </li>
          ))}
        </ul>
      </nav>
    </aside>
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
    end
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
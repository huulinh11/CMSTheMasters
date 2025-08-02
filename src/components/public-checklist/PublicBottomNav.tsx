import { NavLink, useParams } from "react-router-dom";
import { Gift, Calendar, ClipboardList, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const navItems = [
  { to: "", icon: Gift, label: "Quyền lợi", end: true },
  { to: "/event-info", icon: Calendar, label: "Sự kiện" },
  { to: "/tasks", icon: ClipboardList, label: "Tác vụ" },
  { to: "/info", icon: User, label: "Cá nhân" },
];

const PublicBottomNav = () => {
  const { phone } = useParams();

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      <nav className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            to={`/checklist/${phone}${item.to}`}
            icon={item.icon}
            label={item.label}
            end={item.end}
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
}

const NavItem: React.FC<NavItemProps> = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
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

export default PublicBottomNav;
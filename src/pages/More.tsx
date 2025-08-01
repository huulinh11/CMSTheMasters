import { NavLink } from "react-router-dom";
import {
  Info,
  CircleDollarSign,
  CalendarClock,
  UserCircle,
  Settings,
  ChevronRight,
  LucideIcon,
  Megaphone,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const moreLinks = [
  { to: "/media-benefits", icon: Megaphone, label: "Quyền lợi truyền thông" },
  { to: "/information", icon: Info, label: "Thông tin" },
  { to: "/revenue", icon: CircleDollarSign, label: "Doanh thu" },
  { to: "/timeline", icon: CalendarClock, label: "Timeline" },
  { to: "/public-user", icon: Globe, label: "Public User" },
  { to: "/account", icon: UserCircle, label: "Tài khoản" },
  { to: "/settings", icon: Settings, label: "Cấu hình" },
];

const More = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6 text-slate-800">Khác</h1>
      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          <ul className="divide-y divide-slate-200">
            {moreLinks.map((link) => (
              <li key={link.to}>
                <MoreLinkItem to={link.to} icon={link.icon} label={link.label} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

interface MoreLinkItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
}

const MoreLinkItem: React.FC<MoreLinkItemProps> = ({ to, icon: Icon, label }) => (
  <NavLink to={to} className="flex items-center p-4 hover:bg-slate-50 transition-colors">
    <Icon className="w-6 h-6 mr-4 text-slate-600" />
    <span className="flex-1 text-slate-800 font-medium">{label}</span>
    <ChevronRight className="w-5 h-5 text-slate-400" />
  </NavLink>
);

export default More;
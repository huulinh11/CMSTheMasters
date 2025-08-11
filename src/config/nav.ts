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
  Globe,
  Percent,
} from "lucide-react";

export type NavItemType = {
  id: string;
  to: string;
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
  end?: boolean;
  isMoreLink?: boolean;
};

export const allNavItems: NavItemType[] = [
  { id: "dashboard", to: "/", icon: LayoutDashboard, label: "Dashboard", mobileLabel: "Home", end: true },
  { id: "guests", to: "/guests", icon: Users, label: "Khách mời" },
  { id: "media-benefits", to: "/media-benefits", icon: Megaphone, label: "Quyền lợi truyền thông", mobileLabel: "Quyền lợi" },
  { id: "event-tasks", to: "/event-tasks", icon: ClipboardList, label: "Tác vụ sự kiện", mobileLabel: "Tác vụ" },
  { id: "information", to: "/information", icon: Info, label: "Thông tin", isMoreLink: true },
  { id: "revenue", to: "/revenue", icon: CircleDollarSign, label: "Doanh thu", isMoreLink: true },
  { id: "commission", to: "/commission", icon: Percent, label: "Hoa hồng", isMoreLink: true },
  { id: "timeline", to: "/timeline", icon: CalendarClock, label: "Timeline", isMoreLink: true },
  { id: "public-user", to: "/public-user", icon: Globe, label: "Public User", isMoreLink: true },
  { id: "account", to: "/account", icon: UserCircle, label: "Tài khoản", isMoreLink: true },
  { id: "settings", to: "/settings", icon: Settings, label: "Cấu hình", isMoreLink: true },
];
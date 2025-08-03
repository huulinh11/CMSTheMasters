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
} from "lucide-react";
import { AppUser, USER_ROLES } from "@/types/app-user";

export type NavItemType = {
  to: string;
  icon: LucideIcon;
  label: string;
  mobileLabel?: string;
  roles?: AppUser['role'][];
  end?: boolean;
  isMoreLink?: boolean;
};

export const allNavItems: NavItemType[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", mobileLabel: "Home", end: true, roles: USER_ROLES },
  { to: "/guests", icon: Users, label: "Khách mời", roles: USER_ROLES },
  { to: "/media-benefits", icon: Megaphone, label: "Quyền lợi truyền thông", mobileLabel: "Quyền lợi", roles: USER_ROLES },
  { to: "/event-tasks", icon: ClipboardList, label: "Tác vụ sự kiện", mobileLabel: "Tác vụ", roles: USER_ROLES },
  { to: "/information", icon: Info, label: "Thông tin", isMoreLink: true, roles: USER_ROLES },
  { to: "/revenue", icon: CircleDollarSign, label: "Doanh thu", roles: ['Admin', 'Quản lý', 'Sale'], isMoreLink: true },
  { to: "/timeline", icon: CalendarClock, label: "Timeline", isMoreLink: true, roles: USER_ROLES },
  { to: "/public-user", icon: Globe, label: "Public User", isMoreLink: true, roles: USER_ROLES },
  { to: "/account", icon: UserCircle, label: "Tài khoản", roles: ['Admin', 'Quản lý'], isMoreLink: true },
  { to: "/settings", icon: Settings, label: "Cấu hình", isMoreLink: true, roles: USER_ROLES },
];
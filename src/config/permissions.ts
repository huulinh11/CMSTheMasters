import { AppUser } from "@/types/app-user";
import { allNavItems } from "./nav";

export const permissionsByRole: Record<AppUser['role'], string[]> = {
  // Admin và Quản lý có tất cả các quyền
  Admin: allNavItems.map(item => item.id),
  'Quản lý': allNavItems.map(item => item.id),
  
  // Sale có các quyền liên quan đến kinh doanh và khách mời
  Sale: [
    "dashboard",
    "guests",
    "media-benefits",
    "event-tasks",
    "information",
    "revenue",
    "timeline",
    "public-user",
    "settings"
  ],

  // Nhân viên có các quyền cơ bản, không bao gồm doanh thu và quản lý tài khoản
  'Nhân viên': [
    "dashboard",
    "guests",
    "media-benefits",
    "event-tasks",
    "information",
    "timeline",
    "public-user",
    "settings"
  ],
};

export const getPermissionsForRole = (role?: AppUser['role']): string[] => {
  if (!role) return [];
  return permissionsByRole[role] || [];
};
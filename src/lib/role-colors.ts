import { Role } from "@/types/vip-guest";
import { GuestRole } from "@/types/guest";

export const VIP_ROLE_COLORS: Record<Role, string> = {
  "Prime Speaker": "bg-red-100 text-red-800",
  "Guest Speaker": "bg-blue-100 text-blue-800",
  "Mentor kiến tạo": "bg-green-100 text-green-800",
  "Phó BTC": "bg-yellow-100 text-yellow-800",
  "Đại sứ": "bg-purple-100 text-purple-800",
  "Cố vấn": "bg-indigo-100 text-indigo-800",
  "Giám đốc": "bg-pink-100 text-pink-800",
  "Nhà tài trợ": "bg-orange-100 text-orange-800",
};

export const GUEST_ROLE_COLORS: Record<GuestRole, string> = {
  "Khách phổ thông": "bg-gray-100 text-gray-800",
  "VIP": "bg-amber-100 text-amber-800",
  "V-Vip": "bg-lime-100 text-lime-800",
  "Super Vip": "bg-fuchsia-100 text-fuchsia-800",
  "Vé trải nghiệm": "bg-cyan-100 text-cyan-800",
};
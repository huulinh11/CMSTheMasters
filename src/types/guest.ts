import { z } from "zod";

export const GUEST_ROLES = [
  "Khách phổ thông",
  "VIP",
  "V-Vip",
  "Super Vip",
  "Vé trải nghiệm",
] as const;

export type GuestRole = (typeof GUEST_ROLES)[number];

export const guestFormSchema = z.object({
  name: z.string().min(1, { message: "Tên không được để trống." }),
  role: z.enum(GUEST_ROLES, {
    required_error: "Vui lòng chọn một vai trò.",
  }),
  phone: z.string().min(10, { message: "Số điện thoại phải có ít nhất 10 ký tự." }),
  referrer: z.string().optional(),
  notes: z.string().optional(),
});

export type GuestFormValues = z.infer<typeof guestFormSchema>;

export type Guest = GuestFormValues & {
  id: string;
};
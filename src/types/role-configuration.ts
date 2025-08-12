import { z } from "zod";

export const ROLE_TYPES = ["Chức vụ", "Khách mời"] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export const roleConfigSchema = z.object({
  name: z.string().min(1, "Tên vai trò không được để trống."),
  type: z.enum(ROLE_TYPES, {
    required_error: "Vui lòng chọn loại vai trò.",
  }),
  sponsorship_amount: z.number().min(0, "Số tiền không được âm."),
  referral_quota: z.coerce.number().min(0, "Số chỉ tiêu không được âm.").optional().default(10),
  bg_color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Mã màu không hợp lệ.").optional().default("#EFF6FF"),
  text_color: z.string().regex(/^#([0-9a-f]{3}){1,2}$/i, "Mã màu không hợp lệ.").optional().default("#1E40AF"),
});

export type RoleConfigFormValues = z.infer<typeof roleConfigSchema>;

export type RoleConfiguration = RoleConfigFormValues & {
  id: string;
  created_at: string;
};
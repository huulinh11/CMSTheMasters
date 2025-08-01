import { z } from "zod";

export const ROLE_TYPES = ["Chức vụ", "Khách mời"] as const;
export type RoleType = (typeof ROLE_TYPES)[number];

export const roleConfigSchema = z.object({
  name: z.string().min(1, "Tên vai trò không được để trống."),
  type: z.enum(ROLE_TYPES, {
    required_error: "Vui lòng chọn loại vai trò.",
  }),
  sponsorship_amount: z.number().min(0, "Số tiền không được âm."),
});

export type RoleConfigFormValues = z.infer<typeof roleConfigSchema>;

export type RoleConfiguration = RoleConfigFormValues & {
  id: string;
  created_at: string;
};
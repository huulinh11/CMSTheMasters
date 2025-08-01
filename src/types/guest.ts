import { z } from "zod";

export const guestFormSchema = z.object({
  name: z.string().min(1, { message: "Tên không được để trống." }),
  role: z.string({
    required_error: "Vui lòng chọn một vai trò.",
  }),
  phone: z.string().refine(val => val.length === 0 || val.length >= 10, { message: "Số điện thoại phải có ít nhất 10 ký tự hoặc để trống." }),
  referrer: z.string().optional(),
  notes: z.string().optional(),
});

export type GuestFormValues = z.infer<typeof guestFormSchema>;

export type Guest = GuestFormValues & {
  id: string;
  slug?: string;
  profile_content?: any;
  materials?: string;
};
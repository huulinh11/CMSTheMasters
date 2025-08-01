import { z } from "zod";

export const vipGuestFormSchema = z.object({
  name: z.string().min(1, { message: "Tên không được để trống." }),
  role: z.string({
    required_error: "Vui lòng chọn một vai trò.",
  }),
  secondaryInfo: z.string().optional(),
  phone: z.string().refine(val => val.length === 0 || val.length >= 10, { message: "Số điện thoại phải có ít nhất 10 ký tự hoặc để trống." }),
  referrer: z.string().optional(),
  notes: z.string().optional(),
});

export type VipGuestFormValues = z.infer<typeof vipGuestFormSchema>;

export type VipGuest = VipGuestFormValues & {
  id: string;
  slug?: string;
  materials?: string;
  facebook_link?: string;
  profile_content?: any;
  image_url?: string;
};
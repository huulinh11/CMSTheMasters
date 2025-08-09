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
  sponsorship_amount: z.number().min(0, "Số tiền không được âm.").optional(),
  paid_amount: z.number().min(0, "Số tiền không được âm.").optional(),
});

export type VipGuestFormValues = z.infer<typeof vipGuestFormSchema>;

export const PROFILE_STATUSES = ['Trống', 'Đang chỉnh sửa', 'Hoàn tất'] as const;
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];

export type VipGuest = VipGuestFormValues & {
  id: string;
  slug?: string;
  materials?: string;
  facebook_link?: string;
  profile_content?: any;
  image_url?: string;
  profile_status?: ProfileStatus;
  template_id?: string | null;
};
import { z } from "zod";
import { ProfileStatus } from './vip-guest';
import { PAYMENT_SOURCES } from './guest-revenue';
import { ContentBlock } from './profile-content';

export const guestFormSchema = z.object({
  name: z.string().min(1, { message: "Tên không được để trống." }),
  role: z.string({
    required_error: "Vui lòng chọn một vai trò.",
  }),
  phone: z.string().refine(val => val.length === 0 || val.length >= 10, { message: "Số điện thoại phải có ít nhất 10 ký tự hoặc để trống." }),
  referrer: z.string().nullish(),
  notes: z.string().nullish(),
  sponsorship_amount: z.number().min(0, "Số tiền không được âm.").optional(),
  paid_amount: z.number().min(0, "Số tiền không được âm.").optional(),
  payment_source: z.enum(PAYMENT_SOURCES).nullish(),
});

export type GuestFormValues = z.infer<typeof guestFormSchema>;

export type Guest = GuestFormValues & {
  id: string;
  slug?: string;
  profile_content?: ContentBlock[] | null;
  materials?: string;
  profile_status?: ProfileStatus;
  template_id?: string | null;
  zns_sent?: boolean;
  created_at: string;
};
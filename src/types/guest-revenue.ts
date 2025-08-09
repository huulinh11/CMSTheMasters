import { Guest } from './guest';

export const PAYMENT_SOURCES = ["Trống", "Chỉ tiêu", "BTC"] as const;
export type PaymentSource = (typeof PAYMENT_SOURCES)[number];

export type GuestRevenue = Guest & {
  original_sponsorship: number;
  sponsorship: number;
  paid: number;
  unpaid: number;
  payment_source?: PaymentSource;
  is_upsaled: boolean;
  commission: number; // Placeholder
  bill_image_url?: string | null;
};

export type GuestPayment = {
  id: string;
  guest_id: string;
  amount: number;
  created_at: string;
};
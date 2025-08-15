import { VipGuest } from './vip-guest';

export type VipGuestRevenue = {
  id: string;
  name: string;
  role: VipGuest['role'];
  secondaryInfo?: string;
  phone?: string;
  notes?: string;
  sponsorship: number;
  paid: number;
  unpaid: number;
  referrer?: string;
  commission: number; // Placeholder
  created_at: string;
};

export type Payment = {
  id: string;
  guest_id: string;
  amount: number;
  created_at: string;
};
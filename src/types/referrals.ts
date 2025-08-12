export type ReferrerSummary = {
  referrer_id: string;
  referrer_name: string;
  referral_count: number;
  total_revenue: number;
  total_commission: number;
};

export type ReferredGuestDetail = {
  guest_id: string;
  guest_name: string;
  guest_role: string;
  sponsorship_amount: number;
  commission_earned: number;
  is_commissionable: boolean;
};
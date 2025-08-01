export type CommissionSummary = {
  referrer_name: string;
  commissionable_referrals_count: number;
  total_commissionable_amount: number;
  total_commission: number;
};

export type CommissionDetail = {
  referred_guest_name: string;
  referred_guest_role: string;
  sponsorship_amount: number;
  commission_earned: number;
  referral_date: string;
};
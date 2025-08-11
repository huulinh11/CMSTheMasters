export type Service = {
  id: string;
  name: string;
  price: number;
  statuses: string[];
  created_at: string;
  allow_free_trial?: boolean;
};

export type GuestService = {
  id: string;
  guest_id: string;
  guest_name: string;
  guest_phone: string;
  guest_type: 'Chức vụ' | 'Khách mời';
  service_id: string;
  service_name: string;
  price: number;
  paid_amount: number;
  unpaid_amount: number;
  referrer_id: string | null;
  referrer_type: 'guest' | 'sale' | null;
  referrer_name: string | null;
  status: string | null;
  created_at: string;
  is_free_trial?: boolean;
  payment_count: number;
};

export type ServiceCommissionSummary = {
  referrer_id: string;
  referrer_type: string;
  referrer_name: string;
  service_count: number;
  total_service_price: number;
  total_commission: number;
};

export type ServiceCommissionDetail = {
  guest_name: string;
  service_name: string;
  service_price: number;
  commission_earned: number;
  sale_date: string;
};
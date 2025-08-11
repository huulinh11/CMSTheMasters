import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import RevenueStats from "@/components/dashboard/RevenueStats";
import { GuestRevenue } from "@/types/guest-revenue";
import { useAuth } from "@/contexts/AuthContext";

type UpsaleHistory = {
  guest_id: string;
  from_sponsorship: number;
  from_payment_source: string | null;
  created_at: string;
};

const StatDisplay = ({ title, value }: { title: string; value: number }) => (
  <div className="p-3 rounded-lg bg-white/60">
    <p className="text-xs text-slate-500 truncate">{title}</p>
    <p className="text-xl font-bold text-slate-800">{value}</p>
  </div>
);

const DashboardGuestsTab = () => {
  const { profile, user } = useAuth();
  
  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const canViewRevenue = !!(userRole && ['Admin', 'Quản lý', 'Sale'].includes(userRole));
  const canViewSummaryStats = !!(userRole && ['Admin', 'Quản lý'].includes(userRole));

  const { data: vipGuests = [], isLoading: isLoadingVip } = useQuery<(Pick<VipGuest, 'id' | 'role'>)[]>({
    queryKey: ['vip_guests_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id,role');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: regularGuests = [], isLoading: isLoadingRegular } = useQuery<(Pick<Guest, 'id' | 'role'>)[]>({
    queryKey: ['guests_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('id,role');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: vipRevenueData = [], isLoading: isLoadingVipRevenue } = useQuery<any[]>({
    queryKey: ['vip_revenue_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vip_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: canViewRevenue,
  });

  const { data: regularRevenueData = [], isLoading: isLoadingRegularRevenue } = useQuery<any[]>({
    queryKey: ['guest_revenue_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: canViewRevenue,
  });

  const { data: upsaleHistory = [], isLoading: isLoadingHistory } = useQuery<UpsaleHistory[]>({
    queryKey: ['guest_upsale_history_dashboard'],
    queryFn: async () => {
        const { data, error } = await supabase.from('guest_upsale_history').select('guest_id, from_sponsorship, from_payment_source, created_at');
        if (error) throw error;
        return data || [];
    },
    enabled: canViewRevenue,
  });

  const revenueStats = useMemo(() => {
    if (!canViewRevenue) return { totalSponsorship: 0, totalPaid: 0, totalUnpaid: 0 };

    const totalSponsorshipVip = vipRevenueData.reduce((sum, g) => sum + (g.sponsorship || 0), 0);
    const totalPaidVip = vipRevenueData.reduce((sum, g) => sum + (g.paid_amount || 0), 0);

    const historyMap = new Map<string, UpsaleHistory[]>();
    upsaleHistory.forEach(h => {
        const history = historyMap.get(h.guest_id) || [];
        history.push(h);
        historyMap.set(h.guest_id, history);
    });

    const regularGuestsWithEffectiveSponsorship: Partial<GuestRevenue>[] = regularRevenueData.map(g => {
      const originalSponsorship = g.sponsorship || 0;
      let effectiveSponsorship = originalSponsorship;

      if (g.is_upsaled) {
        const guestHistory = historyMap.get(g.id);
        if (guestHistory && guestHistory.length > 0) {
          const firstUpsale = guestHistory.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0];
          if (firstUpsale.from_payment_source === 'Chỉ tiêu') {
            effectiveSponsorship = originalSponsorship - firstUpsale.from_sponsorship;
          }
        }
      } else if (g.payment_source === 'Chỉ tiêu') {
        effectiveSponsorship = 0;
      }

      return {
        ...g,
        sponsorship: effectiveSponsorship,
        paid: g.paid_amount || 0,
      };
    });

    const totalSponsorshipRegular = regularGuestsWithEffectiveSponsorship.reduce((sum, g) => sum + (g.sponsorship || 0), 0);
    const totalPaidRegular = regularGuestsWithEffectiveSponsorship.reduce((sum, g) => sum + (g.paid || 0), 0);

    const totalSponsorship = totalSponsorshipVip + totalSponsorshipRegular;
    const totalPaid = totalPaidVip + totalPaidRegular;
    const totalUnpaid = totalSponsorship - totalPaid;

    return { totalSponsorship, totalPaid, totalUnpaid };
  }, [canViewRevenue, vipRevenueData, regularRevenueData, upsaleHistory]);

  const stats = useMemo(() => {
    const allGuests = [...vipGuests, ...regularGuests];

    const countByRole = (roleName: string) => allGuests.filter(g => g.role === roleName).length;

    const primeSpeakers = countByRole("Prime Speaker");
    const guestSpeakers = countByRole("Guest Speaker");
    const totalSpeakers = primeSpeakers + guestSpeakers;

    const khachPhoThong = countByRole("Khách phổ thông");
    const vip = countByRole("VIP");
    const vVip = countByRole("V-Vip");
    const superVip = countByRole("Super Vip");
    const totalRegularGuests = khachPhoThong + vip + vVip + superVip;

    return {
        totalPeople: allGuests.length,
        
        totalSpeakers,
        primeSpeakers,
        guestSpeakers,
        mentorKienTao: countByRole("Mentor kiến tạo"),

        totalRegularGuests,
        khachPhoThong,
        vip,
        vVip,
        superVip,

        coVan: countByRole("Cố vấn"),
        daiSu: countByRole("Đại sứ"),
        nhaTaiTro: countByRole("Nhà tài trợ"),
        giamDoc: countByRole("Giám đốc"),
        phoBTC: countByRole("Phó BTC"),
    };
  }, [vipGuests, regularGuests]);

  const isLoading = isLoadingVip || isLoadingRegular || (canViewRevenue && (isLoadingVipRevenue || isLoadingRegularRevenue || isLoadingHistory));

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canViewSummaryStats && (
        <div>
          <h2 className="text-lg text-slate-700 font-bold mb-2">Doanh thu</h2>
          <RevenueStats 
            totalSponsorship={revenueStats.totalSponsorship}
            totalPaid={revenueStats.totalPaid}
            totalUnpaid={revenueStats.totalUnpaid}
          />
        </div>
      )}

      <div>
        <h2 className="text-lg text-slate-700 font-bold mb-2">Tổng quan</h2>
        <Card className="bg-white/70 border-none shadow-sm rounded-xl">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-500">Tổng số người</p>
            <p className="text-3xl font-bold text-slate-800">{stats.totalPeople}</p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-lg text-slate-700 font-bold mb-2">Diễn giả & Mentor</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <StatDisplay title="Tổng Speaker" value={stats.totalSpeakers} />
          <StatDisplay title="Prime Speaker" value={stats.primeSpeakers} />
          <StatDisplay title="Guest Speaker" value={stats.guestSpeakers} />
          <StatDisplay title="Mentor kiến tạo" value={stats.mentorKienTao} />
        </div>
      </div>

      <div>
        <h2 className="text-lg text-slate-700 font-bold mb-2">Khách mời</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <StatDisplay title="Tổng khách mời" value={stats.totalRegularGuests} />
          <StatDisplay title="Khách phổ thông" value={stats.khachPhoThong} />
          <StatDisplay title="VIP" value={stats.vip} />
          <StatDisplay title="V-Vip" value={stats.vVip} />
          <StatDisplay title="Super Vip" value={stats.superVip} />
        </div>
      </div>

      <div>
        <h2 className="text-lg text-slate-700 font-bold mb-2">Ban tổ chức & Đối tác</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <StatDisplay title="Cố vấn" value={stats.coVan} />
          <StatDisplay title="Đại sứ" value={stats.daiSu} />
          <StatDisplay title="Nhà tài trợ" value={stats.nhaTaiTro} />
          <StatDisplay title="Giám đốc" value={stats.giamDoc} />
          <StatDisplay title="Phó BTC" value={stats.phoBTC} />
        </div>
      </div>
    </div>
  );
};

export default DashboardGuestsTab;
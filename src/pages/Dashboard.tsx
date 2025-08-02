import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import RevenueStats from "@/components/dashboard/RevenueStats";
import { GuestRevenue } from "@/types/guest-revenue";

type UpsaleHistory = {
  guest_id: string;
  from_sponsorship: number;
  from_payment_source: string | null;
  created_at: string;
};

const Dashboard = () => {
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
    }
  });

  const { data: regularRevenueData = [], isLoading: isLoadingRegularRevenue } = useQuery<any[]>({
    queryKey: ['guest_revenue_dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: upsaleHistory = [], isLoading: isLoadingHistory } = useQuery<UpsaleHistory[]>({
    queryKey: ['guest_upsale_history_dashboard'],
    queryFn: async () => {
        const { data, error } = await supabase.from('guest_upsale_history').select('guest_id, from_sponsorship, from_payment_source, created_at');
        if (error) throw error;
        return data || [];
    }
  });

  const revenueStats = useMemo(() => {
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
  }, [vipRevenueData, regularRevenueData, upsaleHistory]);

  const stats = useMemo(() => {
    const allGuests = [...vipGuests, ...regularGuests];

    const countByRole = (roleName: string) => allGuests.filter(g => g.role === roleName).length;

    const primeSpeakers = countByRole("Prime Speaker");
    const guestSpeakers = countByRole("Guest Speaker");
    const totalSpeakers = primeSpeakers + guestSpeakers;

    const khachPhoThong = countByRole("Khách phổ thông");
    const vip = countByRole("VIP");
    const vVip = countByRole("V-VIP");
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

  const isLoading = isLoadingVip || isLoadingRegular || isLoadingVipRevenue || isLoadingRegularRevenue || isLoadingHistory;

  return (
    <div className="p-4 md:p-6 bg-transparent min-h-full">
      <header className="flex justify-between items-center mb-6">
        <div>
          <p className="text-slate-500 text-sm md:text-base">Welcome home</p>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Ivanovic Suparjo</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-slate-200/50">
            <Bell className="text-slate-600 h-5 w-5 md:h-6 md:w-6" />
            <span className="absolute top-1 right-1.5 block h-2 w-2 rounded-full bg-primary ring-2 ring-slate-50"></span>
          </button>
          <Avatar className="h-9 w-9 md:h-10 md:w-10">
            <AvatarImage src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="User" />
            <AvatarFallback>IS</AvatarFallback>
          </Avatar>
        </div>
      </header>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Revenue Stats */}
          <div>
            <h2 className="text-lg text-slate-700 font-bold mb-2">Doanh thu</h2>
            <RevenueStats 
              totalSponsorship={revenueStats.totalSponsorship}
              totalPaid={revenueStats.totalPaid}
              totalUnpaid={revenueStats.totalUnpaid}
            />
          </div>

          {/* Group 1: Total */}
          <div>
            <h2 className="text-lg text-slate-700 font-bold mb-2">Tổng quan</h2>
            <Card className="bg-white/70 border-none shadow-sm rounded-xl">
              <CardContent className="p-4">
                <p className="text-sm font-medium text-slate-500">Tổng số người</p>
                <p className="text-3xl font-bold text-slate-800">{stats.totalPeople}</p>
              </CardContent>
            </Card>
          </div>

          {/* Group 2 */}
          <div>
            <h2 className="text-lg text-slate-700 font-bold mb-2">Diễn giả & Mentor</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <StatCard title="Tổng Speaker" value={stats.totalSpeakers} />
              <StatCard title="Prime Speaker" value={stats.primeSpeakers} />
              <StatCard title="Guest Speaker" value={stats.guestSpeakers} />
              <StatCard title="Mentor kiến tạo" value={stats.mentorKienTao} />
            </div>
          </div>

          {/* Group 3 */}
          <div>
            <h2 className="text-lg text-slate-700 font-bold mb-2">Khách mời</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <StatCard title="Tổng khách mời" value={stats.totalRegularGuests} />
              <StatCard title="Khách phổ thông" value={stats.khachPhoThong} />
              <StatCard title="VIP" value={stats.vip} />
              <StatCard title="V-Vip" value={stats.vVip} />
              <StatCard title="Super Vip" value={stats.superVip} />
            </div>
          </div>

          {/* Group 4 */}
          <div>
            <h2 className="text-lg text-slate-700 font-bold mb-2">Ban tổ chức & Đối tác</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <StatCard title="Cố vấn" value={stats.coVan} />
              <StatCard title="Đại sứ" value={stats.daiSu} />
              <StatCard title="Nhà tài trợ" value={stats.nhaTaiTro} />
              <StatCard title="Giám đốc" value={stats.giamDoc} />
              <StatCard title="Phó BTC" value={stats.phoBTC} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value }: { title: string; value: number }) => (
  <Card className="bg-white rounded-xl border">
    <CardContent className="p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </CardContent>
  </Card>
);

export default Dashboard;
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, Users, UserCheck, Mic, Presentation, BrainCircuit, Star, Gem, Crown, Shield, Award, Handshake, Briefcase, UserCog 
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";

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

  const isLoading = isLoadingVip || isLoadingRegular;

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
        <div className="space-y-6">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Group 1: Total */}
          <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Tổng số người</p>
                <p className="text-4xl font-bold text-slate-800">{stats.totalPeople}</p>
              </div>
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10">
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          {/* Group 2 */}
          <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Diễn giả & Mentor</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard title="Tổng Speaker" value={stats.totalSpeakers} icon={UserCheck} />
              <StatCard title="Prime Speaker" value={stats.primeSpeakers} icon={Mic} />
              <StatCard title="Guest Speaker" value={stats.guestSpeakers} icon={Presentation} />
              <StatCard title="Mentor kiến tạo" value={stats.mentorKienTao} icon={BrainCircuit} />
            </CardContent>
          </Card>

          {/* Group 3 */}
          <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Khách mời</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Tổng khách mời" value={stats.totalRegularGuests} icon={Users} />
              <StatCard title="Khách phổ thông" value={stats.khachPhoThong} icon={Users} />
              <StatCard title="VIP" value={stats.vip} icon={Star} />
              <StatCard title="V-Vip" value={stats.vVip} icon={Gem} />
              <StatCard title="Super Vip" value={stats.superVip} icon={Crown} />
            </CardContent>
          </Card>

          {/* Group 4 */}
          <Card className="bg-white/70 border-none shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg text-slate-700">Ban tổ chức & Đối tác</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard title="Cố vấn" value={stats.coVan} icon={Shield} />
              <StatCard title="Đại sứ" value={stats.daiSu} icon={Award} />
              <StatCard title="Nhà tài trợ" value={stats.nhaTaiTro} icon={Handshake} />
              <StatCard title="Giám đốc" value={stats.giamDoc} icon={Briefcase} />
              <StatCard title="Phó BTC" value={stats.phoBTC} icon={UserCog} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon }: { title: string; value: number, icon: React.ElementType }) => (
  <Card className="bg-white rounded-2xl border">
    <CardContent className="p-4">
      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 mb-3">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
    </CardContent>
  </Card>
);

export default Dashboard;
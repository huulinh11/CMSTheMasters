import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { MediaBenefit } from "@/types/media-benefit";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRolePermissions } from "@/hooks/useRolePermissions";

type BenefitStat = {
  name: string;
  total: number;
  completed: number;
  uncompleted: number;
};

const isBenefitCompleted = (benefitName: string, benefitData: MediaBenefit | undefined): boolean => {
  if (!benefitData) return false;
  switch (benefitName) {
    case "Thư mời": return benefitData.invitation_status === 'Đã gửi';
    case "Post bài page": return !!benefitData.page_post_link;
    case "Post bài BTC": return !!benefitData.btc_post_link;
    case "Báo trước sự kiện": return !!benefitData.pre_event_news?.some(item => item.post_link);
    case "Báo sau sự kiện": return !!benefitData.post_event_news?.some(item => item.post_link);
    case "Video thảm đỏ": return !!benefitData.red_carpet_video_link;
    case "Video đưa tin": return !!benefitData.news_video?.video_link;
    case "Bộ ảnh Beauty AI": return !!benefitData.beauty_ai_photos_link;
    default: return false;
  }
};

const DashboardBenefitsTab = () => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'progress-asc' | 'progress-desc'>('default');
  const { allBenefits, benefitsByRole, isLoading: isLoadingPermissions } = useRolePermissions();

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<(VipGuest | Guest)[]>({
    queryKey: ['all_guests_for_benefit_stats'],
    queryFn: async () => {
      const { data: vips, error: vipError } = await supabase.from('vip_guests').select('id, role');
      if (vipError) throw vipError;
      const { data: regulars, error: regularError } = await supabase.from('guests').select('id, role');
      if (regularError) throw regularError;
      return [...(vips || []), ...(regulars || [])];
    }
  });

  const { data: benefits = [], isLoading: isLoadingBenefits } = useQuery<MediaBenefit[]>({
    queryKey: ['media_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('media_benefits').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const benefitStats = useMemo((): BenefitStat[] => {
    if (isLoadingGuests || isLoadingBenefits || isLoadingPermissions) return [];

    const benefitsMap = new Map(benefits.map(b => [b.guest_id, b]));

    return allBenefits.map(benefitName => {
      const guestsWithBenefit = guests.filter(g => benefitsByRole[g.role]?.includes(benefitName));
      const total = guestsWithBenefit.length;
      const completed = guestsWithBenefit.filter(g => isBenefitCompleted(benefitName, benefitsMap.get(g.id))).length;
      
      return {
        name: benefitName,
        total,
        completed,
        uncompleted: total - completed,
      };
    });
  }, [guests, benefits, isLoadingGuests, isLoadingBenefits, allBenefits, benefitsByRole, isLoadingPermissions]);

  const filteredAndSortedStats = useMemo(() => {
    let stats = [...benefitStats];

    if (filter === 'completed') {
      stats = stats.filter(s => s.completed === s.total && s.total > 0);
    } else if (filter === 'uncompleted') {
      stats = stats.filter(s => s.uncompleted > 0);
    }

    if (sortOrder === 'progress-asc') {
      stats.sort((a, b) => {
        const progressA = a.total > 0 ? a.completed / a.total : 0;
        const progressB = b.total > 0 ? b.completed / b.total : 0;
        return progressA - progressB;
      });
    } else if (sortOrder === 'progress-desc') {
      stats.sort((a, b) => {
        const progressA = a.total > 0 ? a.completed / a.total : 0;
        const progressB = b.total > 0 ? b.completed / b.total : 0;
        return progressB - progressA;
      });
    }

    return stats;
  }, [benefitStats, filter, sortOrder]);

  if (isLoadingGuests || isLoadingBenefits || isLoadingPermissions) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-end gap-4">
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Sắp xếp theo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Mặc định</SelectItem>
            <SelectItem value="progress-asc">Tiến độ: Thấp đến cao</SelectItem>
            <SelectItem value="progress-desc">Tiến độ: Cao đến thấp</SelectItem>
          </SelectContent>
        </Select>
        <RadioGroup defaultValue="all" onValueChange={(value) => setFilter(value as any)} className="flex items-center space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="b1" /><Label htmlFor="b1">All</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="uncompleted" id="b2" /><Label htmlFor="b2">Chưa</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="b3" /><Label htmlFor="b3">Hoàn thành</Label></div>
        </RadioGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedStats.map(stat => (
          <Card key={stat.name}>
            <CardHeader>
              <CardTitle className="text-base">{stat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-500">Tiến độ</span>
                <span className="font-semibold">{stat.completed} / {stat.total}</span>
              </div>
              <Progress value={stat.total > 0 ? (stat.completed / stat.total) * 100 : 0} />
              <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-green-600">Hoàn thành: {stat.completed}</span>
                <span className="text-red-600">Chưa: {stat.uncompleted}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardBenefitsTab;
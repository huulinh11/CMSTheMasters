import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Guest } from "@/types/guest";
import { MediaBenefit, MediaRegularGuest } from "@/types/media-benefit";
import { RegularMediaBenefitsTable } from "../../components/media-benefits/RegularMediaBenefitsTable";
import { RegularMediaBenefitsCards } from "../../components/media-benefits/RegularMediaBenefitsCards";
import { EditAllMediaBenefitsDialog } from "../../components/media-benefits/EditAllMediaBenefitsDialog";
import { AdvancedFilterSheet } from "../../components/media-benefits/AdvancedFilterSheet";
import { showSuccess, showError } from "@/utils/toast";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { RoleConfiguration } from "@/types/role-configuration";

const regularBenefitFields = [
  { name: 'invitation_status', label: 'Thư mời', options: [
    { value: 'all', label: 'Tất cả' },
    { value: 'Đã gửi', label: 'Đã gửi' },
    { value: 'Đã có', label: 'Đã có' },
    { value: 'Trống', label: 'Trống' },
  ]},
  { name: 'post_event_news_draft', label: 'Báo sau SK (Nháp)', options: [
    { value: 'all', label: 'Tất cả' },
    { value: 'has_data', label: 'Đã có' },
    { value: 'no_data', label: 'Chưa có' },
  ]},
  { name: 'post_event_news_final', label: 'Báo sau SK (Final)', options: [
    { value: 'all', label: 'Tất cả' },
    { value: 'has_data', label: 'Đã có' },
    { value: 'no_data', label: 'Chưa có' },
  ]},
  { name: 'beauty_ai_photos_link', label: 'Bộ ảnh Beauty AI', options: [
    { value: 'all', label: 'Tất cả' },
    { value: 'has_data', label: 'Đã có' },
    { value: 'no_data', label: 'Chưa có' },
  ]},
  { name: 'red_carpet_video_link', label: 'Video thảm đỏ', options: [
    { value: 'all', label: 'Tất cả' },
    { value: 'has_data', label: 'Đã có' },
    { value: 'no_data', label: 'Chưa có' },
  ]},
];

export default function RegularMediaBenefitsTab() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({});
  const [editingGuest, setEditingGuest] = useState<MediaRegularGuest | null>(null);

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: roleConfigs = [] } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Khách mời'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Khách mời');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: benefits = [], isLoading: isLoadingBenefits } = useQuery<MediaBenefit[]>({
    queryKey: ['media_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('media_benefits').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const benefitsMap = useMemo(() => {
    return new Map(benefits.map(b => [b.guest_id, b]));
  }, [benefits]);

  const combinedGuests = useMemo((): MediaRegularGuest[] => {
    return guests.map(guest => ({
      ...guest,
      media_benefit: benefitsMap.get(guest.id),
    }));
  }, [guests, benefitsMap]);

  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(guest => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase());

      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);

      const advancedMatch = Object.entries(advancedFilters).every(([field, value]) => {
        if (!value || value === 'all') return true;
        const benefit = guest.media_benefit;

        const checkSimpleLink = (link: string | null | undefined) => {
          if (value === 'has_data') return !!link;
          if (value === 'no_data') return !link;
          return true;
        };

        const checkNews = (newsData: MediaBenefit['post_event_news'], type: 'draft' | 'final') => {
          const linkField = type === 'draft' ? 'article_link' : 'post_link';
          if (value === 'has_data') return newsData?.some(item => !!item[linkField]);
          if (value === 'no_data') return !newsData || newsData.every(item => !item[linkField]);
          return true;
        };

        switch (field) {
          case 'invitation_status':
            return (benefit?.invitation_status || 'Trống') === value;
          case 'beauty_ai_photos_link':
          case 'red_carpet_video_link':
            return checkSimpleLink(benefit?.[field]);
          
          case 'post_event_news_draft':
            return checkNews(benefit?.post_event_news, 'draft');
          case 'post_event_news_final':
            return checkNews(benefit?.post_event_news, 'final');

          default:
            return true;
        }
      });

      return searchMatch && roleMatch && advancedMatch;
    });
  }, [combinedGuests, searchTerm, roleFilters, advancedFilters]);

  const mutation = useMutation({
    mutationFn: async ({ guestId, benefits }: { guestId: string, benefits: Partial<MediaBenefit> }) => {
      const { error } = await supabase.from('media_benefits').upsert(
        { guest_id: guestId, ...benefits },
        { onConflict: 'guest_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media_benefits'] });
      showSuccess("Cập nhật thành công!");
      setEditingGuest(null);
    },
    onError: (error) => showError(error.message),
  });

  const handleUpdateBenefit = useCallback((guestId: string, field: string, value: any) => {
    mutation.mutate({ guestId, benefits: { [field]: value } });
  }, [mutation]);

  const handleSaveAllBenefits = (guestId: string, benefits: Partial<MediaBenefit>) => {
    mutation.mutate({ guestId, benefits });
  };

  const handleFilterChange = (field: string, value: string) => {
    setAdvancedFilters(prev => ({ ...prev, [field]: value }));
  };

  const isLoading = isLoadingGuests || isLoadingBenefits;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, vai trò, ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/80 flex-grow"
        />
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-between">
                Lọc vai trò <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {roleConfigs.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role.id}
                  checked={roleFilters.includes(role.name)}
                  onCheckedChange={(checked) => {
                    setRoleFilters(
                      checked ? [...roleFilters, role.name] : roleFilters.filter((r) => r !== role.name)
                    );
                  }}
                >
                  {role.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <AdvancedFilterSheet
            filters={advancedFilters}
            onFilterChange={handleFilterChange}
            benefitFields={regularBenefitFields}
          />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <RegularMediaBenefitsCards
          guests={filteredGuests}
          onUpdateBenefit={handleUpdateBenefit}
          onEdit={setEditingGuest}
        />
      ) : (
        <RegularMediaBenefitsTable
          guests={filteredGuests}
          onUpdateBenefit={handleUpdateBenefit}
          onEdit={setEditingGuest}
        />
      )}
      <EditAllMediaBenefitsDialog
        guest={editingGuest}
        open={!!editingGuest}
        onOpenChange={() => setEditingGuest(null)}
        onSave={handleSaveAllBenefits}
      />
    </div>
  );
}
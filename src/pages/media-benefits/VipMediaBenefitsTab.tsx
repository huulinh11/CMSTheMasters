import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VipGuest } from "@/types/vip-guest";
import { MediaBenefit, MediaVipGuest } from "@/types/media-benefit";
import { VipMediaBenefitsTable } from "../../components/media-benefits/VipMediaBenefitsTable";
import { VipMediaBenefitsCards } from "../../components/media-benefits/VipMediaBenefitsCards";
import { EditLinkDialog } from "../../components/media-benefits/EditLinkDialog";
import { EditMediaBenefitDialog } from "../../components/media-benefits/EditMediaBenefitDialog";
import { showSuccess, showError } from "@/utils/toast";

export default function VipMediaBenefitsTab() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingLink, setEditingLink] = useState<{ guest: MediaVipGuest, field: string } | null>(null);
  const [editingComplex, setEditingComplex] = useState<{ guest: MediaVipGuest, field: string } | null>(null);

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false });
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

  const combinedGuests = useMemo((): MediaVipGuest[] => {
    return guests.map(guest => ({
      ...guest,
      media_benefit: benefitsMap.get(guest.id),
    }));
  }, [guests, benefitsMap]);

  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(guest =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedGuests, searchTerm]);

  const mutation = useMutation({
    mutationFn: async ({ guestId, field, value }: { guestId: string, field: string, value: any }) => {
      const { error } = await supabase.from('media_benefits').upsert(
        { guest_id: guestId, [field]: value },
        { onConflict: 'guest_id' }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media_benefits'] });
      showSuccess("Cập nhật thành công!");
    },
    onError: (error) => showError(error.message),
  });

  const handleUpdateBenefit = useCallback((guestId: string, field: string, value: any) => {
    mutation.mutate({ guestId, field, value });
  }, [mutation]);

  const handleSaveLink = (link: string) => {
    if (editingLink) {
      handleUpdateBenefit(editingLink.guest.id, editingLink.field, link);
      setEditingLink(null);
    }
  };

  const handleSaveComplexBenefit = (data: any) => {
    if (editingComplex) {
      handleUpdateBenefit(editingComplex.guest.id, editingComplex.field, data);
      setEditingComplex(null);
    }
  };

  const isLoading = isLoadingGuests || isLoadingBenefits;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm theo tên, vai trò, ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white/80"
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <VipMediaBenefitsCards
          guests={filteredGuests}
          onUpdateBenefit={handleUpdateBenefit}
          onEditLink={(guest, field) => setEditingLink({ guest, field })}
          onEditComplexBenefit={(guest, field) => setEditingComplex({ guest, field })}
        />
      ) : (
        <VipMediaBenefitsTable
          guests={filteredGuests}
          onUpdateBenefit={handleUpdateBenefit}
          onEditLink={(guest, field) => setEditingLink({ guest, field })}
          onEditComplexBenefit={(guest, field) => setEditingComplex({ guest, field })}
        />
      )}
      <EditLinkDialog
        open={!!editingLink}
        onOpenChange={() => setEditingLink(null)}
        onSave={handleSaveLink}
        title={`Sửa link cho ${editingLink?.guest.name}`}
        initialValue={editingLink ? editingLink.guest.media_benefit?.[editingLink.field] : ""}
      />
      <EditMediaBenefitDialog
        open={!!editingComplex}
        onOpenChange={() => setEditingComplex(null)}
        onSave={handleSaveComplexBenefit}
        guest={editingComplex?.guest || null}
        benefitType={editingComplex?.field as any}
      />
    </div>
  );
}
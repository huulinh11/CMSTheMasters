import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { RoleConfiguration } from "@/types/role-configuration";
import { useAuth } from "@/contexts/AuthContext";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RevenueStats from "@/components/dashboard/RevenueStats";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { GuestRevenue } from "@/types/guest-revenue";
import EditSponsorshipDialog from "@/components/Revenue/EditSponsorshipDialog";
import PaymentDialog from "@/components/Revenue/PaymentDialog";
import HistoryDialog from "@/components/Revenue/HistoryDialog";
import GuestPaymentDialog from "@/components/Revenue/GuestPaymentDialog";
import GuestHistoryDialog from "@/components/Revenue/GuestHistoryDialog";
import EditGuestRevenueDialog from "@/components/Revenue/EditGuestRevenueDialog";
import { CombinedRevenueTable } from "@/components/Revenue/CombinedRevenueTable";
import { CombinedRevenueCards } from "@/components/Revenue/CombinedRevenueCards";
import { GuestService } from "@/types/service-sales";
import { VipGuest } from "@/types/vip-guest";

export type CombinedGuestRevenue = ((GuestRevenue & { type: 'Khách mời' }) | (VipGuestRevenue & { type: 'Chức vụ' })) & {
  service_revenue: number;
  total_revenue: number;
  has_history: boolean;
  image_url?: string | null;
};

type UpsaleHistory = {
  guest_id: string;
  from_sponsorship: number;
  from_payment_source: string | null;
  created_at: string;
};

const RevenuePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'Chức vụ' | 'Khách mời'>('all');
  const isMobile = useIsMobile();
  const { profile, user } = useAuth();

  const [payingGuest, setPayingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<CombinedGuestRevenue | null>(null);
  const [editingGuest, setEditingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [upsaleGuest, setUpsaleGuest] = useState<GuestRevenue | null>(null);
  const [viewingGuest, setViewingGuest] = useState<CombinedGuestRevenue | null>(null);

  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const canViewSummaryStats = !!(userRole && ['Admin', 'Quản lý'].includes(userRole));

  const { data: vipGuestsData = [], isLoading: isLoadingVip } = useQuery<VipGuestRevenue[]>({
    queryKey: ['vip_revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vip_guest_revenue_details');
      if (error) throw new Error(error.message);
      return (data || []).map(g => ({
        ...g,
        sponsorship: g.sponsorship || 0,
        paid: g.paid_amount || 0,
        unpaid: (g.sponsorship || 0) - (g.paid_amount || 0),
        secondaryInfo: g.secondary_info,
        commission: 0,
      }));
    }
  });

  const { data: regularGuestsData = [], isLoading: isLoadingRegular } = useQuery<any[]>({
    queryKey: ['guest_revenue_details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: upsaleHistory = [], isLoading: isLoadingHistory } = useQuery<UpsaleHistory[]>({
    queryKey: ['guest_upsale_history'],
    queryFn: async () => {
        const { data, error } = await supabase.from('guest_upsale_history').select('guest_id, from_sponsorship, from_payment_source, created_at');
        if (error) throw error;
        return data || [];
    },
  });

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: guestServices = [], isLoading: isLoadingServices } = useQuery<GuestService[]>({
    queryKey: ['guest_service_details_all_for_revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_service_details');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: vipGuestsWithImages = [], isLoading: isLoadingVipImages } = useQuery<Pick<VipGuest, 'id' | 'image_url'>[]>({
    queryKey: ['vip_guests_images_for_revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id, image_url');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const regularGuests = useMemo((): GuestRevenue[] => {
    if (isLoadingRegular || isLoadingHistory) return [];

    const historyMap = new Map<string, UpsaleHistory[]>();
    upsaleHistory.forEach(h => {
        const history = historyMap.get(h.guest_id) || [];
        history.push(h);
        historyMap.set(h.guest_id, history);
    });

    return regularGuestsData.map(g => {
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
        original_sponsorship: originalSponsorship,
        sponsorship: effectiveSponsorship,
        paid: g.paid_amount || 0,
        unpaid: effectiveSponsorship - (g.paid_amount || 0),
        is_upsaled: g.is_upsaled || false,
        commission: 0,
      };
    });
  }, [regularGuestsData, upsaleHistory, isLoadingRegular, isLoadingHistory]);

  const combinedGuests = useMemo(() => {
    const serviceRevenueByGuest = new Map<string, number>();
    const serviceCountByGuest = new Map<string, number>();
    guestServices.forEach(service => {
        serviceRevenueByGuest.set(service.guest_id, (serviceRevenueByGuest.get(service.guest_id) || 0) + service.price);
        serviceCountByGuest.set(service.guest_id, (serviceCountByGuest.get(service.guest_id) || 0) + 1);
    });

    const vipImagesMap = new Map(vipGuestsWithImages.map(g => [g.id, g.image_url]));

    const vips: CombinedGuestRevenue[] = vipGuestsData.map(g => ({ 
        ...g, 
        type: 'Chức vụ',
        image_url: vipImagesMap.get(g.id),
        service_revenue: serviceRevenueByGuest.get(g.id) || 0,
        total_revenue: (g.sponsorship || 0) + (serviceRevenueByGuest.get(g.id) || 0),
        has_history: (g.paid > 0) || (upsaleHistory.some(h => h.guest_id === g.id)) || (serviceCountByGuest.get(g.id) || 0) > 0
    }));
    const regulars: CombinedGuestRevenue[] = regularGuests.map(g => ({ 
        ...g, 
        type: 'Khách mời',
        image_url: undefined,
        service_revenue: serviceRevenueByGuest.get(g.id) || 0,
        total_revenue: g.sponsorship + (serviceRevenueByGuest.get(g.id) || 0),
        has_history: (g.paid > 0) || (upsaleHistory.some(h => h.guest_id === g.id)) || (serviceCountByGuest.get(g.id) || 0) > 0
    }));
    return [...vips, ...regulars].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [vipGuestsData, regularGuests, guestServices, upsaleHistory, vipGuestsWithImages]);

  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(guest => {
      const searchMatch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || guest.id.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === 'all' || guest.type === typeFilter;
      return searchMatch && typeMatch;
    });
  }, [combinedGuests, searchTerm, typeFilter]);

  const revenueStats = useMemo(() => {
    return filteredGuests.reduce(
      (acc, guest) => {
        acc.totalSponsorship += guest.sponsorship;
        acc.totalPaid += guest.paid;
        acc.totalUnpaid += guest.unpaid;
        return acc;
      },
      { totalSponsorship: 0, totalPaid: 0, totalUnpaid: 0 }
    );
  }, [filteredGuests]);

  const isLoading = isLoadingVip || isLoadingRegular || isLoadingRoles || isLoadingHistory || isLoadingServices || isLoadingVipImages;

  const handleView = (guest: CombinedGuestRevenue) => setViewingGuest(guest);
  const handleEdit = (guest: CombinedGuestRevenue) => setEditingGuest(guest);
  const handlePay = (guest: CombinedGuestRevenue) => setPayingGuest(guest);
  const handleHistory = (guest: CombinedGuestRevenue) => setHistoryGuest(guest);
  const handleUpsale = (guest: CombinedGuestRevenue) => {
    if (guest.type === 'Khách mời') {
      setUpsaleGuest(guest as GuestRevenue);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-4">Quản lý doanh thu</h1>
      
      {canViewSummaryStats && <RevenueStats {...revenueStats} />}

      <div className="my-4 flex flex-col md:flex-row gap-4 md:items-center">
        <RadioGroup defaultValue="all" onValueChange={(value) => setTypeFilter(value as any)} className="flex items-center space-x-4 bg-primary/10 p-1 rounded-lg flex-shrink-0">
          <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="r1" /><Label htmlFor="r1">All</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Chức vụ" id="r2" /><Label htmlFor="r2">Chức vụ</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Khách mời" id="r3" /><Label htmlFor="r3">Khách mời</Label></div>
        </RadioGroup>
        <Input
          placeholder="Tìm kiếm theo tên, ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/80 flex-grow"
        />
      </div>

      <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>

      {isLoading ? (
        <Skeleton className="h-96 w-full rounded-lg mt-4" />
      ) : (
        <div className="mt-4">
          {isMobile ? (
            <CombinedRevenueCards 
              guests={filteredGuests}
              onView={handleView}
              onEdit={handleEdit}
              onPay={handlePay}
              onHistory={handleHistory}
              onUpsale={handleUpsale}
            />
          ) : (
            <CombinedRevenueTable 
              guests={filteredGuests}
              onView={handleView}
              onEdit={handleEdit}
              onPay={handlePay}
              onHistory={handleHistory}
              onUpsale={handleUpsale}
            />
          )}
        </div>
      )}

      {/* Dialogs */}
      <PaymentDialog
        guest={payingGuest?.type === 'Chức vụ' ? payingGuest as VipGuestRevenue : null}
        open={!!payingGuest && payingGuest.type === 'Chức vụ'}
        onOpenChange={(open) => !open && setPayingGuest(null)}
      />
      <GuestPaymentDialog
        guest={payingGuest?.type === 'Khách mời' ? payingGuest as GuestRevenue : null}
        open={!!payingGuest && payingGuest.type === 'Khách mời'}
        onOpenChange={(open) => !open && setPayingGuest(null)}
      />
      <HistoryDialog
        guest={historyGuest?.type === 'Chức vụ' ? historyGuest as VipGuestRevenue : null}
        open={!!historyGuest && historyGuest.type === 'Chức vụ'}
        onOpenChange={(open) => !open && setHistoryGuest(null)}
      />
      <GuestHistoryDialog
        guest={historyGuest?.type === 'Khách mời' ? historyGuest as GuestRevenue : null}
        open={!!historyGuest && historyGuest.type === 'Khách mời'}
        onOpenChange={(open) => !open && setHistoryGuest(null)}
      />
      <EditSponsorshipDialog
        guest={editingGuest?.type === 'Chức vụ' ? editingGuest as VipGuestRevenue : null}
        open={!!editingGuest && editingGuest.type === 'Chức vụ'}
        onOpenChange={(open) => !open && setEditingGuest(null)}
      />
      <EditGuestRevenueDialog
        guest={editingGuest?.type === 'Khách mời' ? editingGuest as GuestRevenue : null}
        open={!!editingGuest && editingGuest.type === 'Khách mời'}
        onOpenChange={(open) => !open && setEditingGuest(null)}
        mode="edit"
        roleConfigs={roleConfigs}
      />
      <EditGuestRevenueDialog
        guest={upsaleGuest}
        open={!!upsaleGuest}
        onOpenChange={(open) => !open && setUpsaleGuest(null)}
        mode="upsale"
        roleConfigs={roleConfigs}
      />
      <GuestDetailsDialog
        guestId={viewingGuest?.id || null}
        guestType={viewingGuest?.type === 'Chức vụ' ? 'vip' : 'regular'}
        open={!!viewingGuest}
        onOpenChange={(isOpen) => !isOpen && setViewingGuest(null)}
        onEdit={() => {}}
        onDelete={() => {}}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default RevenuePage;
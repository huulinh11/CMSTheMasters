import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VipGuest, VipGuestFormValues } from "@/types/vip-guest";
import { Guest, GuestFormValues } from "@/types/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleConfiguration } from "@/types/role-configuration";
import { generateGuestSlug } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { PaymentSource } from "@/types/guest-revenue";
import { AdvancedGuestFilter, AdvancedFilters } from "@/components/guests/AdvancedGuestFilter";
import { PageHeader } from "@/components/PageHeader";
import { ImportExportActions } from "@/components/guests/ImportExportActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { GuestRevenue } from "@/types/guest-revenue";
import { CombinedGuestTable } from "@/components/guests/CombinedGuestTable";
import { CombinedGuestCards } from "@/components/guests/CombinedGuestCards";
import { AddCombinedGuestDialog } from "@/components/guests/AddCombinedGuestDialog";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import PaymentDialog from "@/components/Revenue/PaymentDialog";
import GuestPaymentDialog from "@/components/Revenue/GuestPaymentDialog";
import HistoryDialog from "@/components/Revenue/HistoryDialog";
import GuestHistoryDialog from "@/components/Revenue/GuestHistoryDialog";
import EditGuestRevenueDialog from "@/components/Revenue/EditGuestRevenueDialog";
import EditSponsorshipDialog from "@/components/Revenue/EditSponsorshipDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { removeAccents } from "@/lib/utils";
import { PaginationControls } from "@/components/PaginationControls";

export type CombinedGuestRevenue = ((GuestRevenue & { type: 'Khách mời' }) | (VipGuestRevenue & { type: 'Chức vụ' })) & {
  has_history: boolean;
  image_url?: string | null;
  zns_sent?: boolean;
};

const ITEMS_PER_PAGE = 20;

const GuestsPage = () => {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<'Chức vụ' | 'Khách mời'>('Chức vụ');
  const [roleFilter, setRoleFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Partial<AdvancedFilters>>({});
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [viewingGuestId, setViewingGuestId] = useState<string | null>(null);
  const [payingGuest, setPayingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<CombinedGuestRevenue | null>(null);
  const [upsaleGuest, setUpsaleGuest] = useState<GuestRevenue | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const canDelete = useMemo(() => !!(userRole && ['Admin', 'Quản lý'].includes(userRole)), [userRole]);

  useEffect(() => {
    const viewVip = searchParams.get('view_vip');
    const viewRegular = searchParams.get('view_regular');
    if (viewVip) {
      setActiveTab('Chức vụ');
      setViewingGuestId(viewVip);
      setSearchParams({}, { replace: true });
    } else if (viewRegular) {
      setActiveTab('Khách mời');
      setViewingGuestId(viewRegular);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: roleConfigs = [] } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: allVipGuests = [] } = useQuery<VipGuest[]>({
    queryKey: ['all_vip_guests_for_referral'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id, name');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: vipData, isLoading: isLoadingVip } = useQuery({
    queryKey: ['vip_revenue', currentPage],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vip_guest_revenue_details', { limit_val: ITEMS_PER_PAGE, offset_val: (currentPage - 1) * ITEMS_PER_PAGE });
      if (error) throw new Error(error.message);
      const { data: countData, error: countError } = await supabase.rpc('get_vip_guest_revenue_details_count');
      if (countError) throw new Error(countError.message);
      return { guests: data || [], count: countData || 0 };
    },
    enabled: activeTab === 'Chức vụ',
  });

  const { data: regularData, isLoading: isLoadingRegular } = useQuery({
    queryKey: ['guest_revenue_details', currentPage],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details', { limit_val: ITEMS_PER_PAGE, offset_val: (currentPage - 1) * ITEMS_PER_PAGE });
      if (error) throw new Error(error.message);
      const { data: countData, error: countError } = await supabase.rpc('get_guest_revenue_details_count');
      if (countError) throw new Error(countError.message);
      return { guests: data || [], count: countData || 0 };
    },
    enabled: activeTab === 'Khách mời',
  });

  const { data: allGuestsForExport = [] } = useQuery<CombinedGuestRevenue[]>({
    queryKey: ['all_guests_for_export'],
    queryFn: async () => {
      const { data: vips } = await supabase.rpc('get_vip_guest_revenue_details', { limit_val: 10000, offset_val: 0 });
      const { data: regulars } = await supabase.rpc('get_guest_revenue_details', { limit_val: 10000, offset_val: 0 });
      const combined = [
        ...(vips || []).map((g: any) => ({ ...g, type: 'Chức vụ' as const })),
        ...(regulars || []).map((g: any) => ({ ...g, type: 'Khách mời' as const })),
      ];
      return combined;
    }
  });

  const mutation = useMutation({
    mutationFn: async ({ table, data }: { table: 'vip_guests' | 'guests', data: any }) => {
      const { error } = await supabase.from(table).upsert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
      queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] });
      showSuccess("Lưu thành công!");
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleVipSubmit = (values: VipGuestFormValues) => {
    // ... implementation
  };

  const handleRegularSubmit = (values: GuestFormValues) => {
    // ... implementation
  };

  const handleDelete = async (guestId: string) => {
    const table = activeTab === 'Chức vụ' ? 'vip_guests' : 'guests';
    const { error } = await supabase.from(table).delete().eq('id', guestId);
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Xóa thành công!");
      queryClient.invalidateQueries({ queryKey: [table === 'vip_guests' ? 'vip_revenue' : 'guest_revenue_details'] });
    }
  };

  const handleZnsChange = async (guest: CombinedGuestRevenue, sent: boolean) => {
    const table = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
    const { error } = await supabase.from(table).update({ zns_sent: sent }).eq('id', guest.id);
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Cập nhật trạng thái ZNS thành công!");
      queryClient.invalidateQueries({ queryKey: [table === 'vip_guests' ? 'vip_revenue' : 'guest_revenue_details'] });
    }
  };

  const currentData = activeTab === 'Chức vụ' ? vipData : regularData;
  const isLoading = activeTab === 'Chức vụ' ? isLoadingVip : isLoadingRegular;
  const guests = currentData?.guests || [];
  const totalGuests = currentData?.count || 0;
  const totalPages = Math.ceil(totalGuests / ITEMS_PER_PAGE);

  const filteredGuests = useMemo(() => {
    // Client-side filtering on the current page of data
    return guests.filter(guest => {
      const searchMatch = searchTerm ? removeAccents(guest.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase())) : true;
      const roleMatch = roleFilter === 'all' || guest.role === roleFilter;
      // Advanced filters can be applied here as well
      return searchMatch && roleMatch;
    });
  }, [guests, searchTerm, roleFilter]);

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Quản lý khách mời">
        <div className="flex items-center gap-2">
          {!isMobile && <ImportExportActions guestsToExport={allGuestsForExport} />}
          <Button onClick={() => setIsAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
        </div>
      </PageHeader>
      
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value as any); setCurrentPage(1); }} className="w-full mt-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="Chức vụ">Chức vụ</TabsTrigger>
          <TabsTrigger value="Khách mời">Khách mời</TabsTrigger>
        </TabsList>
        <div className="mt-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Tìm kiếm theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Lọc theo vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {roleConfigs.filter(r => r.type === activeTab).map(role => (
                    <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <AdvancedGuestFilter filters={advancedFilters} onFilterChange={() => {}} onClearFilters={() => {}} />
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Tổng: {totalGuests}</h2>
          {isLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : isMobile ? (
            <CombinedGuestCards guests={filteredGuests} selectedGuests={selectedGuests} onSelectGuest={() => {}} onView={setViewingGuestId} onEdit={setEditingGuest} onPay={setPayingGuest} onHistory={setHistoryGuest} onUpsale={setUpsaleGuest} onDelete={handleDelete} onZnsChange={handleZnsChange} canDelete={canDelete} />
          ) : (
            <CombinedGuestTable guests={filteredGuests} selectedGuests={selectedGuests} onSelectGuest={() => {}} onSelectAll={() => {}} onView={setViewingGuestId} onEdit={setEditingGuest} onPay={setPayingGuest} onHistory={setHistoryGuest} onUpsale={setUpsaleGuest} onDelete={handleDelete} onZnsChange={handleZnsChange} canDelete={canDelete} />
          )}
          <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </Tabs>

      <AddCombinedGuestDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onVipSubmit={handleVipSubmit}
        onRegularSubmit={handleRegularSubmit}
        allVipGuests={allVipGuests}
        roleConfigs={roleConfigs}
      />
      <GuestDetailsDialog
        guestId={viewingGuestId}
        guestType={activeTab === 'Chức vụ' ? 'vip' : 'regular'}
        open={!!viewingGuestId}
        onOpenChange={() => setViewingGuestId(null)}
        onEdit={setEditingGuest}
        onDelete={handleDelete}
        roleConfigs={roleConfigs}
      />
      {/* Other dialogs */}
    </div>
  );
};

export default GuestsPage;
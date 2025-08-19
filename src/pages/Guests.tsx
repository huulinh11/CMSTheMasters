import React, { useState, useMemo, useEffect } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTablePagination } from "@/components/DataTablePagination";

export type CombinedGuestRevenue = ((GuestRevenue & { type: 'Khách mời' }) | (VipGuestRevenue & { type: 'Chức vụ' })) & {
  has_history: boolean;
  image_url?: string | null;
  zns_sent?: boolean;
};

const ITEMS_PER_PAGE = 10;

const GuestsPage = () => {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Partial<AdvancedFilters>>({});
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [viewingGuest, setViewingGuest] = useState<{ id: string, type: 'vip' | 'regular' } | null>(null);
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
      setViewingGuest({ id: viewVip, type: 'vip' });
      setSearchParams({}, { replace: true });
    } else if (viewRegular) {
      setViewingGuest({ id: viewRegular, type: 'regular' });
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
      const { data, error } = await supabase.from('vip_guests').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: vipData, isLoading: isLoadingVip } = useQuery({
    queryKey: ['vip_revenue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_vip_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: regularData, isLoading: isLoadingRegular } = useQuery({
    queryKey: ['guest_revenue_details'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_guest_revenue_details');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const combinedGuests = useMemo(() => {
    const vips = (vipData || []).map((g: any) => ({ ...g, type: 'Chức vụ' as const }));
    const regulars = (regularData || []).map((g: any) => ({ ...g, type: 'Khách mời' as const }));
    return [...vips, ...regulars];
  }, [vipData, regularData]);

  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(guest => {
      const searchMatch = searchTerm === '' ||
        removeAccents(guest.name.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase())) ||
        (guest.phone && guest.phone.includes(searchTerm)) ||
        (guest.type === 'Chức vụ' && guest.secondaryInfo && removeAccents(guest.secondaryInfo.toLowerCase()).includes(removeAccents(searchTerm.toLowerCase())));
      
      const typeMatch = typeFilter === 'all' || guest.type === typeFilter;
      const roleMatch = roleFilter === 'all' || guest.role === roleFilter;

      return searchMatch && typeMatch && roleMatch;
    });
  }, [combinedGuests, searchTerm, typeFilter, roleFilter]);

  const totalPages = Math.ceil(filteredGuests.length / ITEMS_PER_PAGE);
  const paginatedGuests = useMemo(() => {
    return filteredGuests.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  }, [filteredGuests, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, roleFilter, advancedFilters]);

  const handleVipSubmit = (values: VipGuestFormValues) => { /* ... */ };
  const handleRegularSubmit = (values: GuestFormValues) => { /* ... */ };
  const handleDelete = async (guestId: string) => { /* ... */ };
  const handleZnsChange = async (guest: CombinedGuestRevenue, sent: boolean) => { /* ... */ };

  const handleUpsale = (guest: CombinedGuestRevenue) => {
    if (guest.type === 'Khách mời') {
      setUpsaleGuest(guest as GuestRevenue);
    }
  };

  const isLoading = isLoadingVip || isLoadingRegular;

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Quản lý khách mời">
        <div className="flex items-center gap-2">
          {!isMobile && <ImportExportActions guestsToExport={filteredGuests} />}
          <Button onClick={() => setIsAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
        </div>
      </PageHeader>
      
      <div className="mt-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Input
            placeholder="Tìm theo tên, SĐT, thông tin phụ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <div className="flex gap-2">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]"><SelectValue placeholder="Lọc theo vai trò" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {roleConfigs.filter(r => typeFilter === 'all' || r.type === typeFilter).map(role => (
                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AdvancedGuestFilter filters={advancedFilters} onFilterChange={(field, value) => setAdvancedFilters(prev => ({ ...prev, [field]: value }))} onClearFilters={() => setAdvancedFilters({})} />
          </div>
        </div>
        <Tabs
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setRoleFilter('all');
          }}
        >
          <TabsList className="grid w-full grid-cols-3 bg-primary/10 p-1 h-12 rounded-xl">
            <TabsTrigger value="all" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Tất cả</TabsTrigger>
            <TabsTrigger value="Chức vụ" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Chức vụ</TabsTrigger>
            <TabsTrigger value="Khách mời" className="text-base rounded-lg text-slate-900 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md">Khách mời</TabsTrigger>
          </TabsList>
        </Tabs>
        <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : isMobile ? (
          <CombinedGuestCards guests={paginatedGuests} selectedGuests={selectedGuests} onSelectGuest={() => {}} onView={(g) => setViewingGuest({ id: g.id, type: g.type === 'Chức vụ' ? 'vip' : 'regular' })} onEdit={setEditingGuest} onPay={setPayingGuest} onHistory={setHistoryGuest} onUpsale={handleUpsale} onDelete={handleDelete} onZnsChange={handleZnsChange} canDelete={canDelete} />
        ) : (
          <CombinedGuestTable guests={paginatedGuests} selectedGuests={selectedGuests} onSelectGuest={() => {}} onSelectAll={() => {}} onView={(g) => setViewingGuest({ id: g.id, type: g.type === 'Chức vụ' ? 'vip' : 'regular' })} onEdit={setEditingGuest} onPay={setPayingGuest} onHistory={setHistoryGuest} onUpsale={handleUpsale} onDelete={handleDelete} onZnsChange={handleZnsChange} canDelete={canDelete} />
        )}
        <DataTablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <AddCombinedGuestDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onVipSubmit={handleVipSubmit}
        onRegularSubmit={handleRegularSubmit}
        allVipGuests={allVipGuests}
        roleConfigs={roleConfigs}
      />
      <GuestDetailsDialog
        guestId={viewingGuest?.id || null}
        guestType={viewingGuest?.type || null}
        open={!!viewingGuest}
        onOpenChange={() => setViewingGuest(null)}
        onEdit={setEditingGuest}
        onDelete={handleDelete}
        roleConfigs={roleConfigs}
      />
      {/* Other dialogs */}
    </div>
  );
};

export default GuestsPage;
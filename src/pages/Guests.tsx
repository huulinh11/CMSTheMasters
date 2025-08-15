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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import RevenueStats from "@/components/dashboard/RevenueStats";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { GuestRevenue } from "@/types/guest-revenue";
import { GuestService } from "@/types/service-sales";
import { CombinedGuestTable } from "@/components/guests/CombinedGuestTable";
import { CombinedGuestCards } from "@/components/guests/CombinedGuestCards";
import { AddCombinedGuestDialog } from "@/components/guests/AddCombinedGuestDialog";
import { AddVipGuestDialog } from "@/components/vip-guests/AddVipGuestDialog";
import { AddGuestDialog } from "@/components/guests/AddGuestDialog";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import PaymentDialog from "@/components/Revenue/PaymentDialog";
import GuestPaymentDialog from "@/components/Revenue/GuestPaymentDialog";
import HistoryDialog from "@/components/Revenue/HistoryDialog";
import GuestHistoryDialog from "@/components/Revenue/GuestHistoryDialog";
import EditGuestRevenueDialog from "@/components/Revenue/EditGuestRevenueDialog";
import EditSponsorshipDialog from "@/components/Revenue/EditSponsorshipDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type CombinedGuestRevenue = ((GuestRevenue & { type: 'Khách mời' }) | (VipGuestRevenue & { type: 'Chức vụ' })) & {
  service_revenue: number;
  total_revenue: number;
  has_history: boolean;
  image_url?: string | null;
  zns_sent?: boolean;
};

type UpsaleHistory = {
  guest_id: string;
  from_sponsorship: number;
  from_payment_source: string | null;
  created_at: string;
};

const generateVipId = (role: string, existingGuests: VipGuest[]): string => {
    const prefixMap: Record<string, string> = { "Prime Speaker": "PS", "Guest Speaker": "GS", "Mentor kiến tạo": "ME", "Phó BTC": "PB", "Đại sứ": "DS", "Cố vấn": "CV", "Giám đốc": "GD", "Nhà tài trợ": "NT" };
    const prefix = prefixMap[role] || role.substring(0, 2).toUpperCase();
    const roleGuests = existingGuests.filter(g => g.id.startsWith(prefix));
    const nextId = roleGuests.length + 1;
    return `${prefix}${String(nextId).padStart(3, '0')}`;
};

const generateRegularId = (role: string, existingGuests: Guest[]): string => {
    const prefixMap: Record<string, string> = { "Khách phổ thông": "KPT", "VIP": "VIP", "V-Vip": "VVP", "Super Vip": "SVP", "Vé trải nghiệm": "VTN" };
    const prefix = prefixMap[role] || role.substring(0, 3).toUpperCase();
    const roleGuests = existingGuests.filter(g => g.id.startsWith(prefix));
    const nextId = roleGuests.length + 1;
    return `${prefix}${String(nextId).padStart(3, '0')}`;
};

const GuestsPage = () => {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<'all' | 'Chức vụ' | 'Khách mời'>('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [advancedFilters, setAdvancedFilters] = useState<Partial<AdvancedFilters>>({});
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [viewingGuestId, setViewingGuestId] = useState<string | null>(null);
  const [payingGuest, setPayingGuest] = useState<CombinedGuestRevenue | null>(null);
  const [historyGuest, setHistoryGuest] = useState<CombinedGuestRevenue | null>(null);
  const [upsaleGuest, setUpsaleGuest] = useState<GuestRevenue | null>(null);

  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const canDelete = profile && (profile.role === 'Admin' || profile.role === 'Quản lý');
  const canViewSummaryStats = !!(userRole && ['Admin', 'Quản lý'].includes(userRole));

  useEffect(() => {
    const guestIdToView = searchParams.get('view_vip') || searchParams.get('view_regular');
    if (guestIdToView) {
        setViewingGuestId(guestIdToView);
        searchParams.delete('view_vip');
        searchParams.delete('view_regular');
        setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: vipGuests = [], isLoading: isLoadingVip } = useQuery<VipGuest[]>({ queryKey: ['vip_guests'], queryFn: async () => { const { data, error } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false }); if (error) throw new Error(error.message); return (data || []).map((item: any) => ({ ...item, secondaryInfo: item.secondary_info })); } });
  const { data: regularGuests = [], isLoading: isLoadingRegular } = useQuery<Guest[]>({ queryKey: ['guests'], queryFn: async () => { const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false }); if (error) throw new Error(error.message); return data || []; } });
  const { data: vipRevenueData = [] } = useQuery<VipGuestRevenue[]>({ queryKey: ['vip_revenue'], queryFn: async () => { const { data, error } = await supabase.rpc('get_vip_guest_revenue_details'); if (error) throw new Error(error.message); return (data || []).map(g => ({ ...g, sponsorship: g.sponsorship || 0, paid: g.paid_amount || 0, unpaid: (g.sponsorship || 0) - (g.paid_amount || 0), secondaryInfo: g.secondary_info, commission: 0 })); } });
  const { data: regularGuestsData = [] } = useQuery<any[]>({ queryKey: ['guest_revenue_details'], queryFn: async () => { const { data, error } = await supabase.rpc('get_guest_revenue_details'); if (error) throw new Error(error.message); return data || []; } });
  const { data: upsaleHistory = [] } = useQuery<UpsaleHistory[]>({ queryKey: ['guest_upsale_history'], queryFn: async () => { const { data, error } = await supabase.from('guest_upsale_history').select('guest_id, from_sponsorship, from_payment_source, created_at'); if (error) throw error; return data || []; } });
  const { data: roleConfigs = [] } = useQuery<RoleConfiguration[]>({ queryKey: ['role_configurations'], queryFn: async () => { const { data, error } = await supabase.from('role_configurations').select('*'); if (error) throw new Error(error.message); return data || []; } });
  const { data: guestServices = [] } = useQuery<GuestService[]>({ queryKey: ['guest_service_details_all_for_revenue'], queryFn: async () => { const { data, error } = await supabase.rpc('get_guest_service_details'); if (error) throw error; return data || []; } });

  const addVipMutation = useMutation({
    mutationFn: async (values: VipGuestFormValues) => {
      const { sponsorship_amount, paid_amount, ...guestValues } = values;
      const guestId = generateVipId(values.role, vipGuests);
      const slug = generateGuestSlug(values.name);
      const { secondaryInfo, ...rest } = guestValues;
      const guestForDb = { ...rest, id: guestId, slug, secondary_info: secondaryInfo };
      const { error: guestError } = await supabase.from('vip_guests').upsert(guestForDb);
      if (guestError) throw guestError;
      if (sponsorship_amount !== undefined) {
        const { error: revenueError } = await supabase.from('vip_guest_revenue').upsert({ guest_id: guestId, sponsorship: sponsorship_amount }, { onConflict: 'guest_id' });
        if (revenueError) throw revenueError;
      }
      if (paid_amount && paid_amount > 0) {
        const { error: paymentError } = await supabase.from('vip_payments').insert({ guest_id: guestId, amount: paid_amount });
        if (paymentError) throw paymentError;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vip_guests'] }); queryClient.invalidateQueries({ queryKey: ['vip_revenue'] }); showSuccess("Thêm khách thành công!"); },
    onError: (error: any) => showError(error.message),
    onSettled: () => setIsAddDialogOpen(false),
  });

  const addRegularMutation = useMutation({
    mutationFn: async (values: GuestFormValues) => {
      const { sponsorship_amount, paid_amount, payment_source, ...guestValues } = values;
      const guestId = generateRegularId(values.role, regularGuests);
      const slug = generateGuestSlug(values.name);
      const guestForDb = { ...guestValues, id: guestId, slug };
      const { error: guestError } = await supabase.from('guests').upsert(guestForDb);
      if (guestError) throw guestError;
      if (sponsorship_amount !== undefined || payment_source) {
        const { error: revenueError } = await supabase.from('guest_revenue').upsert({ guest_id: guestId, sponsorship: sponsorship_amount || 0, payment_source: payment_source || 'Trống' }, { onConflict: 'guest_id' });
        if (revenueError) throw revenueError;
      }
      if (paid_amount && paid_amount > 0) {
        const { error: paymentError } = await supabase.from('guest_payments').insert({ guest_id: guestId, amount: paid_amount });
        if (paymentError) throw paymentError;
      }
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['guests'] }); queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] }); showSuccess("Thêm khách mời thành công!"); },
    onError: (error: any) => showError(error.message),
    onSettled: () => setIsAddDialogOpen(false),
  });

  const editVipMutation = useMutation({
    mutationFn: async (values: VipGuestFormValues & { id: string }) => {
        const { sponsorship_amount, paid_amount, ...guestValues } = values;
        const { secondaryInfo, ...rest } = guestValues;
        const guestForDb = { ...rest, secondary_info: secondaryInfo };
        const { error: guestError } = await supabase.from('vip_guests').update(guestForDb).eq('id', values.id);
        if (guestError) throw guestError;
        if (sponsorship_amount !== undefined) {
            const { error: revenueError } = await supabase.from('vip_guest_revenue').upsert({ guest_id: values.id, sponsorship: sponsorship_amount }, { onConflict: 'guest_id' });
            if (revenueError) throw revenueError;
        }
        if (paid_amount !== undefined) {
            const { data: existingPayments } = await supabase.from('vip_payments').select('amount').eq('guest_id', values.id);
            const currentPaid = (existingPayments || []).reduce((sum, p) => sum + p.amount, 0);
            if (currentPaid !== paid_amount) {
                await supabase.from('vip_payments').delete().eq('guest_id', values.id);
                if (paid_amount > 0) {
                    await supabase.from('vip_payments').insert({ guest_id: values.id, amount: paid_amount });
                }
            }
        }
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
        queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
        showSuccess("Cập nhật khách thành công!");
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => setEditingGuest(null),
  });

  const editRegularMutation = useMutation({
      mutationFn: async (values: GuestFormValues & { id: string }) => {
          const { sponsorship_amount, paid_amount, payment_source, ...guestValues } = values;
          const { error: guestError } = await supabase.from('guests').update(guestValues).eq('id', values.id);
          if (guestError) throw guestError;
          if (sponsorship_amount !== undefined || payment_source) {
              const { error: revenueError } = await supabase.from('guest_revenue').upsert({ guest_id: values.id, sponsorship: sponsorship_amount || 0, payment_source: payment_source || 'Trống' }, { onConflict: 'guest_id' });
              if (revenueError) throw revenueError;
          }
          if (paid_amount !== undefined) {
              const { data: existingPayments } = await supabase.from('guest_payments').select('amount').eq('guest_id', values.id);
              const currentPaid = (existingPayments || []).reduce((sum, p) => sum + p.amount, 0);
              if (currentPaid !== paid_amount) {
                  await supabase.from('guest_payments').delete().eq('guest_id', values.id);
                  if (paid_amount > 0) {
                      await supabase.from('guest_payments').insert({ guest_id: values.id, amount: paid_amount });
                  }
              }
          }
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['guests'] });
          queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] });
          showSuccess("Cập nhật khách mời thành công!");
      },
      onError: (error: any) => showError(error.message),
      onSettled: () => setEditingGuest(null),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canDelete) throw new Error("Bạn không có quyền xóa khách.");
      const vipsToDelete = ids.filter(id => vipGuests.some(g => g.id === id));
      const regularsToDelete = ids.filter(id => regularGuests.some(g => g.id === id));
      if (vipsToDelete.length > 0) {
        const { error } = await supabase.from('vip_guests').delete().in('id', vipsToDelete);
        if (error) throw new Error(error.message);
      }
      if (regularsToDelete.length > 0) {
        const { error } = await supabase.from('guests').delete().in('id', regularsToDelete);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
      queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] });
      showSuccess(`Đã xóa ${variables.length} khách.`);
      setSelectedGuests([]);
    },
    onError: (error) => showError(error.message),
  });

  const znsUpdateMutation = useMutation({
    mutationFn: async ({ guest, zns_sent }: { guest: CombinedGuestRevenue, zns_sent: boolean }) => {
        const tableName = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
        const { error } = await supabase.from(tableName).update({ zns_sent }).eq('id', guest.id);
        if (error) throw error;
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
        queryClient.invalidateQueries({ queryKey: ['guests'] });
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleSelectGuest = (id: string) => {
    setSelectedGuests(prev =>
      prev.includes(id) ? prev.filter(guestId => guestId !== id) : [...prev, id]
    );
  };

  const handleDelete = (guestId: string) => {
    deleteMutation.mutate([guestId]);
  };

  const regularGuestsWithRevenue = useMemo((): GuestRevenue[] => {
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
          if (firstUpsale.from_payment_source === 'Chỉ tiêu') effectiveSponsorship = originalSponsorship - firstUpsale.from_sponsorship;
        }
      } else if (g.payment_source === 'Chỉ tiêu') effectiveSponsorship = 0;
      return { ...g, original_sponsorship: originalSponsorship, sponsorship: effectiveSponsorship, paid: g.paid_amount || 0, unpaid: effectiveSponsorship - (g.paid_amount || 0), is_upsaled: g.is_upsaled || false, commission: 0 };
    });
  }, [regularGuestsData, upsaleHistory]);

  const combinedGuests = useMemo((): CombinedGuestRevenue[] => {
    const serviceRevenueByGuest = new Map<string, number>();
    const serviceCountByGuest = new Map<string, number>();
    guestServices.forEach(service => {
        serviceRevenueByGuest.set(service.guest_id, (serviceRevenueByGuest.get(service.guest_id) || 0) + service.price);
        serviceCountByGuest.set(service.guest_id, (serviceCountByGuest.get(service.guest_id) || 0) + 1);
    });
    const vips: CombinedGuestRevenue[] = vipRevenueData.map(g => ({ ...g, type: 'Chức vụ', image_url: vipGuests.find(vg => vg.id === g.id)?.image_url, service_revenue: serviceRevenueByGuest.get(g.id) || 0, total_revenue: (g.sponsorship || 0) + (serviceRevenueByGuest.get(g.id) || 0), has_history: (g.paid > 0) || (upsaleHistory.some(h => h.guest_id === g.id)) || (serviceCountByGuest.get(g.id) || 0) > 0, zns_sent: vipGuests.find(vg => vg.id === g.id)?.zns_sent }));
    const regulars: CombinedGuestRevenue[] = regularGuestsWithRevenue.map(g => ({ ...g, type: 'Khách mời', image_url: undefined, service_revenue: serviceRevenueByGuest.get(g.id) || 0, total_revenue: g.sponsorship + (serviceRevenueByGuest.get(g.id) || 0), has_history: (g.paid > 0) || (upsaleHistory.some(h => h.guest_id === g.id)) || (serviceCountByGuest.get(g.id) || 0) > 0, zns_sent: regularGuests.find(rg => rg.id === g.id)?.zns_sent }));
    return [...vips, ...regulars].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [vipRevenueData, regularGuestsWithRevenue, guestServices, upsaleHistory, vipGuests, regularGuests]);

  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(guest => {
      const searchMatch = guest.name.toLowerCase().includes(searchTerm.toLowerCase()) || guest.id.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = typeFilter === 'all' || guest.type === typeFilter;
      const roleMatch = roleFilter === 'all' || guest.role === roleFilter;

      const hasSecondaryInfo = guest.type === 'Chức vụ' && !!guest.secondaryInfo;
      const secondaryInfoMatch = !advancedFilters.secondaryInfo || advancedFilters.secondaryInfo === 'all' || (advancedFilters.secondaryInfo === 'yes' ? hasSecondaryInfo : !hasSecondaryInfo);
      
      const phoneMatch = !advancedFilters.phone || advancedFilters.phone === 'all' || (advancedFilters.phone === 'yes' ? !!guest.phone : !guest.phone);
      const sponsorshipMatch = !advancedFilters.sponsorship || advancedFilters.sponsorship === 'all' || (advancedFilters.sponsorship === 'yes' ? guest.sponsorship > 0 : guest.sponsorship === 0);
      const materialsMatch = !advancedFilters.materials || advancedFilters.materials === 'all' || (advancedFilters.materials === 'yes' ? !!guest.materials : !guest.materials);
      
      const paymentStatusMatch = (() => {
        if (!advancedFilters.paymentStatus || advancedFilters.paymentStatus === 'all') return true;
        if (guest.total_revenue === 0) return advancedFilters.paymentStatus === 'paid';
        switch (advancedFilters.paymentStatus) {
          case 'paid': return guest.unpaid <= 0;
          case 'partially_paid': return guest.paid > 0 && guest.unpaid > 0;
          case 'unpaid': return guest.paid === 0 && guest.unpaid > 0;
          default: return true;
        }
      })();

      const paymentSourceMatch = (() => {
        if (!advancedFilters.paymentSource || advancedFilters.paymentSource === 'all') return true;
        if (guest.type === 'Khách mời') {
          return guest.payment_source === advancedFilters.paymentSource;
        }
        return true;
      })();

      const znsMatch = !advancedFilters.zns || advancedFilters.zns === 'all' || (advancedFilters.zns === 'yes' ? guest.zns_sent : !guest.zns_sent);

      return searchMatch && typeMatch && roleMatch && phoneMatch && sponsorshipMatch && secondaryInfoMatch && materialsMatch && paymentStatusMatch && paymentSourceMatch && znsMatch;
    });
  }, [combinedGuests, searchTerm, typeFilter, roleFilter, advancedFilters]);

  const revenueStats = useMemo(() => {
    return filteredGuests.reduce((acc, guest) => { acc.totalSponsorship += guest.sponsorship; acc.totalPaid += guest.paid; acc.totalUnpaid += guest.unpaid; return acc; }, { totalSponsorship: 0, totalPaid: 0, totalUnpaid: 0 });
  }, [filteredGuests]);

  const allRoles = useMemo(() => [...new Set(roleConfigs.map(r => r.name))].sort(), [roleConfigs]);
  const isLoading = isLoadingVip || isLoadingRegular;

  return (
    <div className="p-4 md:p-6">
      <PageHeader title="Quản lý khách mời">
        <div className="flex items-center gap-2">
          {!isMobile && <ImportExportActions />}
          <Button onClick={() => setIsAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" /> Thêm</Button>
        </div>
      </PageHeader>
      <div className="my-4 flex flex-col md:flex-row gap-4 md:items-center">
        <RadioGroup value={typeFilter} onValueChange={(value) => setTypeFilter(value as any)} className="flex items-center space-x-4 bg-primary/10 p-1 rounded-lg flex-shrink-0">
          <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="r1" /><Label htmlFor="r1">All</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Chức vụ" id="r2" /><Label htmlFor="r2">Chức vụ</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="Khách mời" id="r3" /><Label htmlFor="r3">Khách mời</Label></div>
        </RadioGroup>
      </div>
      {canViewSummaryStats && <div className="my-4"><RevenueStats {...revenueStats} /></div>}
      <div className="my-4 flex flex-col md:flex-row items-center gap-2">
        <Input placeholder="Tìm kiếm..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white/80 flex-grow" />
        <div className="flex w-full md:w-auto items-center gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              {allRoles.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AdvancedGuestFilter 
            filters={advancedFilters} 
            onFilterChange={(field, value) => setAdvancedFilters(prev => ({ ...prev, [field]: value as any }))} 
            onClearFilters={() => setAdvancedFilters({})} 
          />
          {canDelete && selectedGuests.length > 0 && (<Button variant="destructive" onClick={() => deleteMutation.mutate(selectedGuests)} disabled={deleteMutation.isPending}><Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedGuests.length})</Button>)}
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
      {isLoading ? <Skeleton className="h-96 w-full rounded-lg mt-4" /> : (
        <div className="mt-4">
          {isMobile ? (
            <CombinedGuestCards guests={filteredGuests} selectedGuests={selectedGuests} onSelectGuest={handleSelectGuest} onView={(guest) => setViewingGuestId(guest.id)} onEdit={setEditingGuest} onPay={setPayingGuest} onHistory={setHistoryGuest} onUpsale={(guest) => guest.type === 'Khách mời' && setUpsaleGuest(guest)} onDelete={(id) => deleteMutation.mutate([id])} onZnsChange={(guest, sent) => znsUpdateMutation.mutate({ guest, zns_sent: sent })} canDelete={!!canDelete} />
          ) : (
            <CombinedGuestTable guests={filteredGuests} selectedGuests={selectedGuests} onSelectGuest={handleSelectGuest} onSelectAll={(checked) => setSelectedGuests(checked ? filteredGuests.map(g => g.id) : [])} onView={(guest) => setViewingGuestId(guest.id)} onEdit={setEditingGuest} onPay={setPayingGuest} onHistory={setHistoryGuest} onUpsale={(guest) => guest.type === 'Khách mời' && setUpsaleGuest(guest)} onDelete={(id) => deleteMutation.mutate([id])} onZnsChange={(guest, sent) => znsUpdateMutation.mutate({ guest, zns_sent: sent })} canDelete={!!canDelete} />
          )}
        </div>
      )}
      <AddCombinedGuestDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen} onVipSubmit={(values) => addVipMutation.mutate(values)} onRegularSubmit={(values) => addRegularMutation.mutate(values)} allVipGuests={vipGuests} roleConfigs={roleConfigs} />
      <GuestDetailsDialog guestId={viewingGuestId} guestType={combinedGuests.find(g => g.id === viewingGuestId)?.type === 'Chức vụ' ? 'vip' : 'regular'} open={!!viewingGuestId} onOpenChange={(isOpen) => !isOpen && setViewingGuestId(null)} onEdit={(guest) => { setViewingGuestId(null); setEditingGuest(guest); }} onDelete={handleDelete} roleConfigs={roleConfigs} />
      {editingGuest?.type === 'Chức vụ' && <AddVipGuestDialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)} onSubmit={(values) => editVipMutation.mutate({ ...values, id: editingGuest!.id })} defaultValues={editingGuest as any} allGuests={vipGuests} roleConfigs={roleConfigs.filter(r => r.type === 'Chức vụ')} />}
      {editingGuest?.type === 'Khách mời' && <AddGuestDialog open={!!editingGuest} onOpenChange={(open) => !open && setEditingGuest(null)} onSubmit={(values) => editRegularMutation.mutate({ ...values, id: editingGuest!.id })} defaultValues={editingGuest as any} allVipGuests={vipGuests} roleConfigs={roleConfigs.filter(r => r.type === 'Khách mời')} />}
      {payingGuest?.type === 'Chức vụ' && <PaymentDialog guest={payingGuest} open={!!payingGuest} onOpenChange={(open) => !open && setPayingGuest(null)} />}
      {payingGuest?.type === 'Khách mời' && <GuestPaymentDialog guest={payingGuest} open={!!payingGuest} onOpenChange={(open) => !open && setPayingGuest(null)} />}
      {historyGuest?.type === 'Chức vụ' && <HistoryDialog guest={historyGuest} open={!!historyGuest} onOpenChange={(open) => !open && setHistoryGuest(null)} />}
      {historyGuest?.type === 'Khách mời' && <GuestHistoryDialog guest={historyGuest} open={!!historyGuest} onOpenChange={(open) => !open && setHistoryGuest(null)} />}
      <EditGuestRevenueDialog guest={upsaleGuest} open={!!upsaleGuest} onOpenChange={(open) => !open && setUpsaleGuest(null)} mode="upsale" roleConfigs={roleConfigs} />
    </div>
  );
};

export default GuestsPage;
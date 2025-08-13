import React, { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VipGuest, VipGuestFormValues } from "@/types/vip-guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, ChevronDown, Trash2 } from "lucide-react";
import { VipGuestTable } from "@/components/vip-guests/VipGuestTable";
import { VipGuestCards } from "@/components/vip-guests/VipGuestCards";
import { AddVipGuestDialog } from "@/components/vip-guests/AddVipGuestDialog";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleConfiguration } from "@/types/role-configuration";
import { generateGuestSlug } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { AdvancedGuestFilter } from "@/components/guests/AdvancedGuestFilter";

const generateId = (role: string, existingGuests: VipGuest[]): string => {
    const prefixMap: Record<string, string> = {
        "Prime Speaker": "PS", "Guest Speaker": "GS", "Mentor kiến tạo": "ME", "Phó BTC": "PB",
        "Đại sứ": "DS", "Cố vấn": "CV", "Giám đốc": "GD", "Nhà tài trợ": "NT"
    };
    const prefix = prefixMap[role] || role.substring(0, 2).toUpperCase();
    const roleGuests = existingGuests.filter(g => g.id.startsWith(prefix));
    const nextId = roleGuests.length + 1;
    return `${prefix}${String(nextId).padStart(3, '0')}`;
};

const VipGuestTab = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const canDelete = profile && (profile.role === 'Admin' || profile.role === 'Quản lý');

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({});
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<(VipGuest & { sponsorship_amount?: number }) | null>(null);
  const [viewingGuestId, setViewingGuestId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const guestIdToView = searchParams.get('view_vip');
    if (guestIdToView) {
        setViewingGuestId(guestIdToView);
        searchParams.delete('view_vip');
        setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []).map((item: any) => ({
        ...item,
        secondaryInfo: item.secondary_info,
      }));
    }
  });

  const { data: revenueData = [] } = useQuery<{guest_id: string, sponsorship: number}[]>({
    queryKey: ['vip_guest_revenue_for_guests_tab'],
    queryFn: async () => {
        const { data, error } = await supabase.from('vip_guest_revenue').select('guest_id, sponsorship');
        if (error) throw error;
        return data || [];
    }
  });

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Chức vụ'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Chức vụ');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addOrEditMutation = useMutation({
    mutationFn: async (data: { values: VipGuestFormValues, isEditing: boolean, guestId: string, slug: string }) => {
      const { values, isEditing, guestId, slug } = data;
      const { sponsorship_amount, paid_amount, ...guestValues } = values;

      const { secondaryInfo, ...rest } = guestValues;
      const guestForDb = { ...rest, id: guestId, slug, secondary_info: secondaryInfo };
      
      const { error: guestError } = await supabase.from('vip_guests').upsert(guestForDb);
      if (guestError) throw guestError;
      
      if (sponsorship_amount !== undefined) {
        const { error: revenueError } = await supabase.from('vip_guest_revenue').upsert({
          guest_id: guestId,
          sponsorship: sponsorship_amount,
        }, { onConflict: 'guest_id' });
        if (revenueError) throw revenueError;
      }

      if (!isEditing && paid_amount && paid_amount > 0) {
        const { error: paymentError } = await supabase.from('vip_payments').insert({
          guest_id: guestId,
          amount: paid_amount,
        });
        if (paymentError) throw paymentError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
      queryClient.invalidateQueries({ queryKey: ['vip_guest_revenue_for_guests_tab'] });
      showSuccess(editingGuest ? "Cập nhật khách thành công!" : "Thêm khách thành công!");
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setIsFormOpen(false);
      setEditingGuest(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canDelete) throw new Error("Bạn không có quyền xóa khách.");
      const { error } = await supabase.from('vip_guests').delete().in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
      queryClient.invalidateQueries({ queryKey: ['vip_guest_revenue_for_guests_tab'] });
      showSuccess(`Đã xóa ${variables.length} khách.`);
      setSelectedGuests([]);
    },
    onError: (error) => showError(error.message),
  });

  const guestsWithRevenue = useMemo(() => {
    const revenueMap = new Map(revenueData.map(r => [r.guest_id, r.sponsorship]));
    return guests.map(guest => ({
      ...guest,
      sponsorship_amount: revenueMap.get(guest.id) || 0,
    }));
  }, [guests, revenueData]);

  const filteredGuests = useMemo(() => {
    return guestsWithRevenue.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.phone && guest.phone.includes(searchTerm)) ||
        guest.role.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);
      
      const advancedMatch = Object.entries(advancedFilters).every(([field, value]) => {
        if (!value || value === 'all') return true;
        const hasValue = (val: any) => val !== null && val !== undefined && val !== '';

        switch (field) {
          case 'phone':
            return value === 'yes' ? hasValue(guest.phone) : !hasValue(guest.phone);
          case 'sponsorship':
            return value === 'yes' ? guest.sponsorship_amount > 0 : guest.sponsorship_amount === 0;
          case 'secondaryInfo':
            return value === 'yes' ? hasValue(guest.secondaryInfo) : !hasValue(guest.secondaryInfo);
          case 'materials':
            return value === 'yes' ? hasValue(guest.materials) : !hasValue(guest.materials);
          default:
            return true;
        }
      });

      return searchMatch && roleMatch && advancedMatch;
    });
  }, [guestsWithRevenue, searchTerm, roleFilters, advancedFilters]);

  const handleSelectGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((guestId) => guestId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedGuests(checked ? filteredGuests.map((g) => g.id) : []);
  };

  const handleAddOrEditGuest = (values: VipGuestFormValues) => {
    const isEditing = !!editingGuest;
    const guestId = editingGuest ? editingGuest.id : generateId(values.role, guests);
    const slug = editingGuest?.slug || generateGuestSlug(values.name);
    addOrEditMutation.mutate({ values, isEditing, guestId, slug });
  };

  const handleOpenEditDialog = (guest: VipGuest) => {
    const revenue = revenueData.find(r => r.guest_id === guest.id);
    setEditingGuest({
        ...guest,
        sponsorship_amount: revenue?.sponsorship,
    });
    setIsFormOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    setEditingGuest(null);
    setIsFormOpen(true);
  };

  const handleViewGuest = (guest: VipGuest) => {
    setViewingGuestId(guest.id);
  };

  const handleEditFromDetails = (guestToEdit: VipGuest) => {
    setViewingGuestId(null);
    setTimeout(() => {
      handleOpenEditDialog(guestToEdit);
    }, 150);
  };

  const handleDeleteGuest = (id: string) => {
    deleteMutation.mutate([id]);
    setViewingGuestId(null);
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) {
      showError("Vui lòng chọn ít nhất một khách để xóa.");
      return;
    }
    deleteMutation.mutate(selectedGuests);
  };

  const isLoading = isLoadingGuests || isLoadingRoles;

  return (
    <div className="space-y-4">
      {isMobile ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
            <Button onClick={handleOpenAddDialog} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow bg-white/80"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-auto justify-between bg-white/80">
                  Lọc <ChevronDown className="ml-2 h-4 w-4" />
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
            <AdvancedGuestFilter
              filters={advancedFilters}
              onFilterChange={(field, value) => setAdvancedFilters(prev => ({ ...prev, [field]: value }))}
              onClearFilters={() => setAdvancedFilters({})}
              filterConfig={{ showPhone: true, showSponsorship: true, showSecondaryInfo: true, showMaterials: true }}
            />
          </div>
          {canDelete && selectedGuests.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteMutation.isPending} className="w-full">
              <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedGuests.length})
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm
            </Button>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-2">
            <Input
              placeholder="Tìm kiếm theo tên, SĐT, vai trò..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow bg-white/80"
            />
            <div className="flex w-full md:w-auto items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-auto justify-between bg-white/80">
                    Lọc theo vai trò <ChevronDown className="ml-2 h-4 w-4" />
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
              <AdvancedGuestFilter
                filters={advancedFilters}
                onFilterChange={(field, value) => setAdvancedFilters(prev => ({ ...prev, [field]: value }))}
                onClearFilters={() => setAdvancedFilters({})}
                filterConfig={{ showPhone: true, showSponsorship: true, showSecondaryInfo: true, showMaterials: true }}
              />
              {canDelete && selectedGuests.length > 0 && (
                <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedGuests.length})
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {isMobile ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-lg" />)
          ) : (
            <Skeleton className="h-96 w-full rounded-lg" />
          )}
        </div>
        ) : isMobile ? (
        <VipGuestCards
          guests={filteredGuests}
          selectedGuests={selectedGuests}
          onSelectGuest={handleSelectGuest}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteGuest}
          onView={handleViewGuest}
          roleConfigs={roleConfigs}
          canDelete={!!canDelete}
        />
      ) : (
        <VipGuestTable
          guests={filteredGuests}
          selectedGuests={selectedGuests}
          onSelectGuest={handleSelectGuest}
          onSelectAll={handleSelectAll}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteGuest}
          onView={handleViewGuest}
          roleConfigs={roleConfigs}
          canDelete={!!canDelete}
        />
      )}

      <AddVipGuestDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddOrEditGuest}
        defaultValues={editingGuest}
        allGuests={guests}
        roleConfigs={roleConfigs}
      />
      
      <GuestDetailsDialog
        guestId={viewingGuestId}
        guestType="vip"
        open={!!viewingGuestId}
        onOpenChange={(isOpen) => !isOpen && setViewingGuestId(null)}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteGuest}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default VipGuestTab;
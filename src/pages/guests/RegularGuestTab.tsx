import React, { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Guest, GuestFormValues } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, ChevronDown, Trash2 } from "lucide-react";
import { GuestTable } from "@/components/guests/GuestTable";
import { GuestCards } from "@/components/guests/GuestCards";
import { AddGuestDialog } from "@/components/guests/AddGuestDialog";
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleConfiguration } from "@/types/role-configuration";
import { generateGuestSlug } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchParams } from "react-router-dom";
import { PaymentSource } from "@/types/guest-revenue";

const generateId = (role: string, existingGuests: Guest[]): string => {
    const prefixMap: Record<string, string> = {
        "Khách phổ thông": "KPT", "VIP": "VIP", "V-Vip": "VVP", "Super Vip": "SVP", "Vé trải nghiệm": "VTN"
    };
    const prefix = prefixMap[role] || role.substring(0, 3).toUpperCase();
    const roleGuests = existingGuests.filter(g => g.id.startsWith(prefix));
    const nextId = roleGuests.length + 1;
    return `${prefix}${String(nextId).padStart(3, '0')}`;
};

const RegularGuestTab = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const canDelete = profile && (profile.role === 'Admin' || profile.role === 'Quản lý');

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<(Guest & { sponsorship_amount?: number, payment_source?: PaymentSource }) | null>(null);
  const [viewingGuestId, setViewingGuestId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const guestIdToView = searchParams.get('view_regular');
    if (guestIdToView) {
        setViewingGuestId(guestIdToView);
        searchParams.delete('view_regular');
        setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: revenueData = [] } = useQuery<{guest_id: string, sponsorship: number, payment_source: PaymentSource}[]>({
    queryKey: ['guest_revenue_for_guests_tab'],
    queryFn: async () => {
        const { data, error } = await supabase.from('guest_revenue').select('guest_id, sponsorship, payment_source');
        if (error) throw error;
        return data || [];
    }
  });

  const { data: vipGuests = [] } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests_for_referrer'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id, name').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Khách mời'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Khách mời');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addOrEditMutation = useMutation({
    mutationFn: async (data: { values: GuestFormValues, isEditing: boolean, guestId: string, slug: string }) => {
      const { values, isEditing, guestId, slug } = data;
      const { sponsorship_amount, paid_amount, payment_source, ...guestValues } = values;

      const guestForDb = { ...guestValues, id: guestId, slug };
      const { error: guestError } = await supabase.from('guests').upsert(guestForDb);
      if (guestError) throw guestError;

      if (sponsorship_amount !== undefined || payment_source) {
        const { error: revenueError } = await supabase.from('guest_revenue').upsert({
          guest_id: guestId,
          sponsorship: sponsorship_amount || 0,
          payment_source: payment_source || 'Trống',
        }, { onConflict: 'guest_id' });
        if (revenueError) throw revenueError;
      }

      if (!isEditing && paid_amount && paid_amount > 0) {
        const { error: paymentError } = await supabase.from('guest_payments').insert({
          guest_id: guestId,
          amount: paid_amount,
        });
        if (paymentError) throw paymentError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] });
      queryClient.invalidateQueries({ queryKey: ['guest_revenue_for_guests_tab'] });
      showSuccess(editingGuest ? "Cập nhật khách mời thành công!" : "Thêm khách mời thành công!");
    },
    onError: (error) => showError(error.message),
    onSettled: () => {
      setIsDialogOpen(false);
      setEditingGuest(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!canDelete) throw new Error("Bạn không có quyền xóa khách.");
      const { error } = await supabase.from('guests').delete().in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['guest_revenue_details'] });
      queryClient.invalidateQueries({ queryKey: ['guest_revenue_for_guests_tab'] });
      showSuccess(`Đã xóa ${variables.length} khách mời.`);
      setSelectedGuests([]);
    },
    onError: (error) => showError(error.message),
  });

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (guest.phone && guest.phone.includes(searchTerm)) ||
        guest.role.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);
      return searchMatch && roleMatch;
    });
  }, [guests, searchTerm, roleFilters]);

  const handleSelectGuest = (id: string) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((guestId) => guestId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedGuests(checked ? filteredGuests.map((g) => g.id) : []);
  };

  const handleAddOrEditGuest = (values: GuestFormValues) => {
    const isEditing = !!editingGuest;
    const guestId = editingGuest ? editingGuest.id : generateId(values.role, guests);
    const slug = editingGuest?.slug || generateGuestSlug(values.name);
    addOrEditMutation.mutate({ values, isEditing, guestId, slug });
  };

  const handleOpenEditDialog = (guest: Guest) => {
    const revenue = revenueData.find(r => r.guest_id === guest.id);
    setEditingGuest({
        ...guest,
        sponsorship_amount: revenue?.sponsorship,
        payment_source: revenue?.payment_source,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteGuest = (id: string) => {
    deleteMutation.mutate([id]);
    setViewingGuestId(null);
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) {
      showError("Vui lòng chọn ít nhất một khách mời để xóa.");
      return;
    }
    deleteMutation.mutate(selectedGuests);
  };

  const handleViewGuest = (guest: Guest) => {
    setViewingGuestId(guest.id);
  };

  const handleEditFromDetails = (guestToEdit: Guest) => {
    setViewingGuestId(null);
    setTimeout(() => {
      handleOpenEditDialog(guestToEdit);
    }, 150);
  };

  const isLoading = isLoadingGuests || isLoadingRoles;

  return (
    <div className="space-y-4">
      {isMobile ? (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
            <Button onClick={() => { setEditingGuest(null); setIsDialogOpen(true); }} size="sm">
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
            <Button onClick={() => { setEditingGuest(null); setIsDialogOpen(true); }}>
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
        <GuestCards
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
        <GuestTable
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

      <AddGuestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddOrEditGuest}
        defaultValues={editingGuest}
        allVipGuests={vipGuests}
        roleConfigs={roleConfigs}
      />

      <GuestDetailsDialog
        guestId={viewingGuestId}
        guestType="regular"
        open={!!viewingGuestId}
        onOpenChange={(isOpen) => !isOpen && setViewingGuestId(null)}
        onEdit={handleEditFromDetails}
        onDelete={handleDeleteGuest}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default RegularGuestTab;
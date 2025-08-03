import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VipGuest, VipGuestFormValues } from "@/types/vip-guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, ChevronDown, Trash2, Upload, Download, Edit, MoreVertical } from "lucide-react";
import { VipGuestTable } from "@/components/vip-guests/VipGuestTable";
import { VipGuestCards } from "@/components/vip-guests/VipGuestCards";
import { AddVipGuestDialog } from "@/components/vip-guests/AddVipGuestDialog";
import { ViewVipGuestSheet } from "@/components/vip-guests/ViewVipGuestSheet";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleConfiguration } from "@/types/role-configuration";
import { generateGuestSlug } from "@/lib/slug";
import { useAuth } from "@/contexts/AuthContext";

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
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<VipGuest | null>(null);
  const [viewingGuest, setViewingGuest] = useState<VipGuest | null>(null);
  const isMobile = useIsMobile();

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

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Chức vụ'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Chức vụ');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addOrEditMutation = useMutation({
    mutationFn: async (guest: VipGuest) => {
      const { secondaryInfo, ...rest } = guest;
      const guestForDb = { ...rest, secondary_info: secondaryInfo };
      
      const { error: guestError } = await supabase.from('vip_guests').upsert(guestForDb);
      if (guestError) throw guestError;
      
      if (!editingGuest) {
        const roleConfig = roleConfigs.find(rc => rc.name === guest.role);
        if (roleConfig) {
          const { error: revenueError } = await supabase.from('vip_guest_revenue').upsert({
            guest_id: guest.id,
            sponsorship: roleConfig.sponsorship_amount
          }, { onConflict: 'guest_id' });
          if (revenueError) throw revenueError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['vip_revenue'] });
      showSuccess(editingGuest ? "Cập nhật khách thành công!" : "Thêm khách thành công!");
      setIsFormOpen(false);
      setEditingGuest(null);
    },
    onError: (error) => showError(error.message),
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
      showSuccess(`Đã xóa ${variables.length} khách.`);
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

  const handleAddOrEditGuest = (values: VipGuestFormValues) => {
    const guestToUpsert: VipGuest = {
      id: editingGuest ? editingGuest.id : generateId(values.role, guests),
      slug: editingGuest?.slug || generateGuestSlug(values.name),
      ...values,
    };
    addOrEditMutation.mutate(guestToUpsert);
  };

  const handleOpenEditDialog = (guest: VipGuest) => {
    setEditingGuest(guest);
    setIsFormOpen(true);
  };
  
  const handleOpenAddDialog = () => {
    setEditingGuest(null);
    setIsFormOpen(true);
  };

  const handleViewGuest = (guest: VipGuest) => {
    setViewingGuest(guest);
  };

  const handleEditFromView = (guest: VipGuest) => {
    setViewingGuest(null);
    setTimeout(() => {
      handleOpenEditDialog(guest);
    }, 150);
  };

  const handleDeleteGuest = (id: string) => {
    deleteMutation.mutate([id]);
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
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Download className="mr-2 h-4 w-4" /> Export
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Upload className="mr-2 h-4 w-4" /> Import
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleOpenAddDialog} size="sm">
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm
              </Button>
            </div>
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
            <div className="flex items-center gap-2">
              <Button variant="outline"><Download className="mr-2 h-4 w-4" /> Export</Button>
              <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Import</Button>
              <Button onClick={handleOpenAddDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm
              </Button>
            </div>
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
        <VipGuestCards
          guests={filteredGuests}
          selectedGuests={selectedGuests}
          onSelectGuest={handleSelectGuest}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteGuest}
          onView={handleViewGuest}
          roleConfigs={roleConfigs}
          canDelete={canDelete}
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
          canDelete={canDelete}
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
      
      <ViewVipGuestSheet
        guest={viewingGuest}
        open={!!viewingGuest}
        onOpenChange={(open) => !open && setViewingGuest(null)}
        onEdit={handleEditFromView}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};

export default VipGuestTab;
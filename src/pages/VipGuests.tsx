import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { VipGuest, VipGuestFormValues, ROLES, Role } from "@/types/vip-guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, ChevronDown, Trash2, Upload, Download } from "lucide-react";
import { VipGuestTable } from "@/components/vip-guests/VipGuestTable";
import { VipGuestCards } from "@/components/vip-guests/VipGuestCards";
import { AddVipGuestDialog } from "@/components/vip-guests/AddVipGuestDialog";
import { ViewVipGuestSheet } from "@/components/vip-guests/ViewVipGuestSheet";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const generateId = (role: Role, existingGuests: VipGuest[]): string => {
    const prefixMap: Record<string, string> = {
        "Prime Speaker": "PS", "Guest Speaker": "GS", "Mentor kiến tạo": "ME", "Phó BTC": "PB",
        "Đại sứ": "DS", "Cố vấn": "CV", "Giám đốc": "GD", "Nhà tài trợ": "NT"
    };
    const prefix = prefixMap[role] || role.substring(0, 2).toUpperCase();
    const roleGuests = existingGuests.filter(g => g.id.startsWith(prefix));
    const nextId = roleGuests.length + 1;
    return `${prefix}${String(nextId).padStart(3, '0')}`;
};

const VipGuests = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<VipGuest | null>(null);
  const [viewingGuest, setViewingGuest] = useState<VipGuest | null>(null);
  const isMobile = useIsMobile();

  const { data: guests = [], isLoading } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      // Map snake_case from DB to camelCase for the app
      return (data || []).map((item: any) => ({
        ...item,
        secondaryInfo: item.secondary_info,
      }));
    }
  });

  const addOrEditMutation = useMutation({
    mutationFn: async (guest: Omit<VipGuest, 'created_at'>) => {
      // Map camelCase from app to snake_case for the DB
      const { secondaryInfo, ...rest } = guest;
      const guestForDb = {
        ...rest,
        secondary_info: secondaryInfo,
      };
      const { error } = await supabase.from('vip_guests').upsert(guestForDb);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      showSuccess(editingGuest ? "Cập nhật khách thành công!" : "Thêm khách thành công!");
      setIsFormOpen(false);
      setEditingGuest(null);
    },
    onError: (error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('vip_guests').delete().in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      showSuccess(`Đã xóa ${variables.length} khách.`);
      setSelectedGuests([]);
    },
    onError: (error) => showError(error.message),
  });

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.phone.includes(searchTerm) ||
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
    const guestToUpsert = {
      id: editingGuest ? editingGuest.id : generateId(values.role, guests),
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

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Khách chức vụ ({filteredGuests.length})</h1>
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
          className="flex-grow"
        />
        <div className="flex w-full md:w-auto items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-between">
                Lọc theo vai trò <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ROLES.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role}
                  checked={roleFilters.includes(role)}
                  onCheckedChange={(checked) => {
                    setRoleFilters(
                      checked ? [...roleFilters, role] : roleFilters.filter((r) => r !== role)
                    );
                  }}
                >
                  {role}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedGuests.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={deleteMutation.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedGuests.length})
            </Button>
          )}
        </div>
      </div>

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
        />
      )}

      <AddVipGuestDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleAddOrEditGuest}
        defaultValues={editingGuest}
        allGuests={guests}
      />
      
      <ViewVipGuestSheet
        guest={viewingGuest}
        open={!!viewingGuest}
        onOpenChange={(open) => !open && setViewingGuest(null)}
      />
    </div>
  );
};

export default VipGuests;
import React, { useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Guest, GuestFormValues, GUEST_ROLES, GuestRole } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle, ChevronDown, Trash2, Upload, Download, MoreVertical } from "lucide-react";
import { GuestTable } from "@/components/guests/GuestTable";
import { GuestCards } from "@/components/guests/GuestCards";
import { AddGuestDialog } from "@/components/guests/AddGuestDialog";
import { ViewGuestSheet } from "@/components/guests/ViewGuestSheet";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

const generateId = (role: GuestRole, existingGuests: Guest[]): string => {
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
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [viewingGuest, setViewingGuest] = useState<Guest | null>(null);
  const isMobile = useIsMobile();

  const { data: guests = [], isLoading } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
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

  const addOrEditMutation = useMutation({
    mutationFn: async (guest: Omit<Guest, 'created_at'>) => {
      const { error } = await supabase.from('guests').upsert(guest);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showSuccess(editingGuest ? "Cập nhật khách mời thành công!" : "Thêm khách mời thành công!");
      setIsDialogOpen(false);
      setEditingGuest(null);
    },
    onError: (error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('guests').delete().in('id', ids);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['guests'] });
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
    const guestToUpsert = {
      id: editingGuest ? editingGuest.id : generateId(values.role, guests),
      ...values,
    };
    addOrEditMutation.mutate(guestToUpsert);
  };

  const handleOpenEditDialog = (guest: Guest) => {
    setEditingGuest(guest);
    setIsDialogOpen(true);
  };

  const handleDeleteGuest = (id: string) => {
    deleteMutation.mutate([id]);
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) {
      showError("Vui lòng chọn ít nhất một khách mời để xóa.");
      return;
    }
    deleteMutation.mutate(selectedGuests);
  };

  const handleViewGuest = (guest: Guest) => {
    setViewingGuest(guest);
  };

  const handleEditFromView = (guest: Guest) => {
    setViewingGuest(null);
    setTimeout(() => {
      handleOpenEditDialog(guest);
    }, 150);
  };

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
              <Button onClick={() => { setEditingGuest(null); setIsDialogOpen(true); }} size="sm">
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
                {GUEST_ROLES.map((role) => (
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
          </div>
          {selectedGuests.length > 0 && (
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
              <Button onClick={() => { setEditingGuest(null); setIsDialogOpen(true); }}>
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
                  {GUEST_ROLES.map((role) => (
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
        />
      )}

      <AddGuestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddOrEditGuest}
        defaultValues={editingGuest}
        allVipGuests={vipGuests}
      />

      <ViewGuestSheet
        guest={viewingGuest}
        open={!!viewingGuest}
        onOpenChange={(open) => !open && setViewingGuest(null)}
        onEdit={handleEditFromView}
      />
    </div>
  );
};

export default RegularGuestTab;
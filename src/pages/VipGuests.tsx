import React, { useState, useMemo, useCallback } from "react";
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
import { showSuccess, showError } from "@/utils/toast";

const MOCK_GUESTS: VipGuest[] = [
  { id: "PS001", name: "Nguyễn Văn A", role: "Prime Speaker", phone: "0912345678", secondaryInfo: "CEO ABC Corp", referrer: "Trần Thị B", notes: "Cần chuẩn bị slide" },
  { id: "GS001", name: "Lê Thị C", role: "Guest Speaker", phone: "0987654321", secondaryInfo: "CTO XYZ Inc", referrer: "Nguyễn Văn A", notes: "" },
  { id: "ME001", name: "Phạm Văn D", role: "Mentor kiến tạo", phone: "0905123456", secondaryInfo: "Founder Startup Z", referrer: "", notes: "Tham gia phiên thảo luận" },
  { id: "PB001", name: "Hoàng Thị E", role: "Phó BTC", phone: "0333444555", secondaryInfo: "Phụ trách hậu cần", referrer: "", notes: "Liên hệ thường xuyên" },
];

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
  const [guests, setGuests] = useState<VipGuest[]>(MOCK_GUESTS);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<VipGuest | null>(null);
  const isMobile = useIsMobile();

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
    if (editingGuest) {
      // Edit
      setGuests(guests.map(g => g.id === editingGuest.id ? { ...editingGuest, ...values } : g));
      showSuccess("Cập nhật khách mời thành công!");
    } else {
      // Add
      const newGuest: VipGuest = {
        id: generateId(values.role, guests),
        ...values,
      };
      setGuests([...guests, newGuest]);
      showSuccess("Thêm khách mời thành công!");
    }
    setEditingGuest(null);
  };

  const handleOpenEditDialog = (guest: VipGuest) => {
    setEditingGuest(guest);
    setIsDialogOpen(true);
  };

  const handleDeleteGuest = (id: string) => {
    setGuests(guests.filter(g => g.id !== id));
    setSelectedGuests(selectedGuests.filter(guestId => guestId !== id));
    showSuccess("Xóa khách mời thành công!");
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) {
      showError("Vui lòng chọn ít nhất một khách mời để xóa.");
      return;
    }
    setGuests(guests.filter(g => !selectedGuests.includes(g.id)));
    setSelectedGuests([]);
    showSuccess(`Đã xóa ${selectedGuests.length} khách mời.`);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Khách chức vụ ({filteredGuests.length})</h1>
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
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Xóa ({selectedGuests.length})
            </Button>
          )}
        </div>
      </div>

      {isMobile ? (
        <VipGuestCards
          guests={filteredGuests}
          selectedGuests={selectedGuests}
          onSelectGuest={handleSelectGuest}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteGuest}
        />
      ) : (
        <VipGuestTable
          guests={filteredGuests}
          selectedGuests={selectedGuests}
          onSelectGuest={handleSelectGuest}
          onSelectAll={handleSelectAll}
          onEdit={handleOpenEditDialog}
          onDelete={handleDeleteGuest}
        />
      )}

      <AddVipGuestDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={handleAddOrEditGuest}
        defaultValues={editingGuest}
      />
    </div>
  );
};

export default VipGuests;
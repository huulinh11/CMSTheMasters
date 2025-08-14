import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit } from "lucide-react";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VipGuestTableProps {
  guests: (VipGuest & { referrerName?: string })[];
  selectedGuests: string[];
  onSelectGuest: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (guest: VipGuest) => void;
  onDelete: (id: string) => void;
  onView: (guest: VipGuest) => void;
  roleConfigs: RoleConfiguration[];
  canDelete: boolean;
}

export const VipGuestTable = ({
  guests,
  selectedGuests,
  onSelectGuest,
  onSelectAll,
  onEdit,
  onDelete,
  onView,
  roleConfigs,
  canDelete,
}: VipGuestTableProps) => {
  const allSelected = guests.length > 0 && selectedGuests.length === guests.length;
  const isIndeterminate = selectedGuests.length > 0 && selectedGuests.length < guests.length;

  const getRoleColors = (roleName: string) => {
    const config = roleConfigs.find(rc => rc.name === roleName);
    return {
      backgroundColor: config?.bg_color || '#EFF6FF',
      color: config?.text_color || '#1E40AF',
    };
  };

  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(Boolean(checked))}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Ảnh</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Thông tin phụ</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead>Người giới thiệu</TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedGuests.includes(guest.id)}
                    onCheckedChange={() => onSelectGuest(guest.id)}
                    aria-label={`Select ${guest.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={guest.image_url} alt={guest.name} />
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{guest.id}</TableCell>
                <TableCell className="font-semibold text-slate-800">
                  <button onClick={() => onView(guest)} className="text-left hover:underline">
                    {guest.name}
                  </button>
                </TableCell>
                <TableCell>
                  <span 
                    className="px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap"
                    style={getRoleColors(guest.role)}
                  >
                    {guest.role}
                  </span>
                </TableCell>
                <TableCell>{guest.secondaryInfo}</TableCell>
                <TableCell>{guest.phone}</TableCell>
                <TableCell>{guest.referrerName || guest.referrer}</TableCell>
                <TableCell className="max-w-[200px] truncate">{guest.notes}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(guest)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Sửa
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem onClick={() => onDelete(guest.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
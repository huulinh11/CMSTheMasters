import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Edit, CreditCard, History, TrendingUp, Trash2, MoreHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CombinedGuestRevenue } from "@/pages/Guests";

interface CombinedGuestTableProps {
  guests: CombinedGuestRevenue[];
  selectedGuests: string[];
  onSelectGuest: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onView: (guest: CombinedGuestRevenue) => void;
  onEdit: (guest: CombinedGuestRevenue) => void;
  onPay: (guest: CombinedGuestRevenue) => void;
  onHistory: (guest: CombinedGuestRevenue) => void;
  onUpsale: (guest: CombinedGuestRevenue) => void;
  onDelete: (id: string) => void;
  onZnsChange: (guest: CombinedGuestRevenue, sent: boolean) => void;
  canDelete: boolean;
}

export const CombinedGuestTable = ({ guests, selectedGuests, onSelectGuest, onSelectAll, onView, onEdit, onPay, onHistory, onUpsale, onDelete, onZnsChange, canDelete }: CombinedGuestTableProps) => {
  const allSelected = guests.length > 0 && selectedGuests.length === guests.length;

  return (
    <div className="rounded-lg border bg-white overflow-x-auto">
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
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead className="w-48">Thông tin phụ</TableHead>
            <TableHead>Người giới thiệu</TableHead>
            <TableHead className="w-48">Ghi chú</TableHead>
            <TableHead>ZNS</TableHead>
            <TableHead>Tài trợ</TableHead>
            <TableHead>Đã trả</TableHead>
            <TableHead>Còn lại</TableHead>
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
                    <AvatarImage src={guest.image_url || ''} alt={guest.name} />
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">
                  <button onClick={() => onView(guest)} className="text-left hover:underline">
                    {guest.name}
                  </button>
                </TableCell>
                <TableCell>
                  {guest.role}
                  {guest.type === 'Khách mời' && guest.is_upsaled && (
                    <div className="text-xs text-red-500 font-semibold mt-1">Đã upsale</div>
                  )}
                </TableCell>
                <TableCell>{guest.phone || ''}</TableCell>
                <TableCell className="break-words" title={guest.type === 'Chức vụ' ? guest.secondaryInfo : undefined}>
                  {guest.type === 'Chức vụ' ? guest.secondaryInfo || '' : ''}
                </TableCell>
                <TableCell>{guest.referrer || ''}</TableCell>
                <TableCell className="break-words" title={guest.notes || undefined}>
                  {guest.notes || ''}
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={!!guest.zns_sent}
                    onCheckedChange={(checked) => onZnsChange(guest, !!checked)}
                  />
                </TableCell>
                <TableCell>{formatCurrency(guest.sponsorship)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(guest.paid)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(guest.unpaid)}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(guest)}><Edit className="mr-2 h-4 w-4" /> Sửa</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}><CreditCard className="mr-2 h-4 w-4" /> Thanh toán</DropdownMenuItem>
                      {guest.has_history && <DropdownMenuItem onClick={() => onHistory(guest)}><History className="mr-2 h-4 w-4" /> Lịch sử</DropdownMenuItem>}
                      {guest.type === 'Khách mời' && <DropdownMenuItem onClick={() => onUpsale(guest)}><TrendingUp className="mr-2 h-4 w-4" /> Upsale</DropdownMenuItem>}
                      {canDelete && <DropdownMenuItem onClick={() => onDelete(guest.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={13} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
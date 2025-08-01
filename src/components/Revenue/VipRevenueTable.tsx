import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Edit, History, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VipRevenueTableProps {
  guests: VipGuestRevenue[];
  onPay: (guest: VipGuestRevenue) => void;
  onHistory: (guest: VipGuestRevenue) => void;
  onEdit: (guest: VipGuestRevenue) => void;
  onView: (guest: VipGuestRevenue) => void;
}

const VipRevenueTable = ({ guests, onPay, onHistory, onEdit, onView }: VipRevenueTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Tài trợ</TableHead>
            <TableHead>Đã thanh toán</TableHead>
            <TableHead>Chưa thanh toán</TableHead>
            <TableHead>Người giới thiệu</TableHead>
            <TableHead>Hoa hồng</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>{guest.id}</TableCell>
                <TableCell>
                  <button onClick={() => onView(guest)} className="font-medium text-primary hover:underline">
                    {guest.name}
                  </button>
                </TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell>{formatCurrency(guest.sponsorship)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(guest.paid)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(guest.unpaid)}</TableCell>
                <TableCell>{guest.referrer || ""}</TableCell>
                <TableCell>{formatCurrency(guest.commission)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}>
                    Thanh toán
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0 ml-2">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onHistory(guest)}>
                        <History className="mr-2 h-4 w-4" /> Lịch sử
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(guest)}>
                        <Edit className="mr-2 h-4 w-4" /> Sửa tài trợ
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                Không có dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default VipRevenueTable;
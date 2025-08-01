import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GuestRevenue } from "@/types/guest-revenue";
import { formatCurrency } from "@/lib/utils";
import { MoreHorizontal, Edit, History, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { RoleConfiguration } from "@/types/role-configuration";

interface RegularRevenueTableProps {
  guests: GuestRevenue[];
  onPay: (guest: GuestRevenue) => void;
  onHistory: (guest: GuestRevenue) => void;
  onEdit: (guest: GuestRevenue) => void;
  onUpsale: (guest: GuestRevenue) => void;
  onView: (guest: GuestRevenue) => void;
  roleConfigs: RoleConfiguration[];
}

const RegularRevenueTable = ({ guests, onPay, onHistory, onEdit, onUpsale, onView, roleConfigs }: RegularRevenueTableProps) => {
  
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
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Tài trợ</TableHead>
            <TableHead>Đã thanh toán</TableHead>
            <TableHead>Chưa thanh toán</TableHead>
            <TableHead>Người giới thiệu</TableHead>
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
                <TableCell>
                  <span 
                    className="px-2 py-1 rounded-md text-xs font-medium"
                    style={getRoleColors(guest.role)}
                  >
                    {guest.role}
                  </span>
                </TableCell>
                <TableCell className={cn(guest.is_upsaled && "text-red-600 font-bold")}>
                  {formatCurrency(guest.sponsorship)}
                </TableCell>
                <TableCell className="text-green-600">{formatCurrency(guest.paid)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(guest.unpaid)}</TableCell>
                <TableCell>{guest.referrer || ""}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}>
                    Thanh toán
                  </Button>
                  <Button variant="secondary" size="sm" className="ml-2" onClick={() => onUpsale(guest)}>
                    Upsale
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
              <TableCell colSpan={8} className="h-24 text-center">
                Không có dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default RegularRevenueTable;
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CombinedGuestRevenue } from "@/pages/Revenue";
import { formatCurrency } from "@/lib/utils";
import { Edit, CreditCard, History, TrendingUp } from "lucide-react";

interface CombinedRevenueTableProps {
  guests: CombinedGuestRevenue[];
  onView: (guest: CombinedGuestRevenue) => void;
  onEdit: (guest: CombinedGuestRevenue) => void;
  onPay: (guest: CombinedGuestRevenue) => void;
  onHistory: (guest: CombinedGuestRevenue) => void;
  onUpsale: (guest: CombinedGuestRevenue) => void;
}

export const CombinedRevenueTable = ({ guests, onView, onEdit, onPay, onHistory, onUpsale }: CombinedRevenueTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Tài trợ</TableHead>
            <TableHead>Tiền dịch vụ</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Đã thanh toán</TableHead>
            <TableHead>Chưa thanh toán</TableHead>
            <TableHead>Nguồn TT</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>{guest.id}</TableCell>
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
                <TableCell>{guest.type}</TableCell>
                <TableCell>
                  {guest.type === 'Khách mời' && guest.is_upsaled ? (
                    <span className="bg-red-600 text-white font-bold px-2 py-1 rounded-md text-xs">
                      {formatCurrency(guest.sponsorship)}
                    </span>
                  ) : (
                    formatCurrency(guest.sponsorship)
                  )}
                </TableCell>
                <TableCell>{formatCurrency(guest.service_revenue)}</TableCell>
                <TableCell className="font-bold">{formatCurrency(guest.total_revenue)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(guest.paid)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(guest.unpaid)}</TableCell>
                <TableCell>{guest.type === 'Khách mời' ? guest.payment_source : 'N/A'}</TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(guest)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}><CreditCard className="h-4 w-4" /></Button>
                  {guest.has_history && (
                    <Button variant="ghost" size="icon" onClick={() => onHistory(guest)}><History className="h-4 w-4" /></Button>
                  )}
                  {guest.type === 'Khách mời' && (
                    <Button variant="ghost" size="icon" onClick={() => onUpsale(guest)}><TrendingUp className="h-4 w-4" /></Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
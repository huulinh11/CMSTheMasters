import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GuestService, Service } from "@/types/service-sales";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GuestServicesTableProps {
  items: GuestService[];
  services: Service[];
  onStatusChange: (id: string, status: string) => void;
  onPay: (item: GuestService) => void;
  onConvertTrial: (id: string) => void;
  onViewGuest: (guest: GuestService) => void;
}

export const GuestServicesTable = ({ items, services, onStatusChange, onPay, onConvertTrial, onViewGuest }: GuestServicesTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Dịch vụ</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Đã trả</TableHead>
            <TableHead>Còn lại</TableHead>
            <TableHead>Người giới thiệu</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => {
              const service = services.find(s => s.id === item.service_id);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <button onClick={() => onViewGuest(item)} className="text-left hover:underline">
                      <div className="font-medium">{item.guest_name}</div>
                      <div className="text-sm text-muted-foreground">{item.guest_phone}</div>
                    </button>
                  </TableCell>
                  <TableCell>
                    {item.service_name}
                    {item.is_free_trial && <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">Free</Badge>}
                  </TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(item.paid_amount)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(item.unpaid_amount)}</TableCell>
                  <TableCell>{item.referrer_name || 'N/A'}</TableCell>
                  <TableCell>
                    {service && service.statuses.length > 0 ? (
                      <Select
                        value={item.status || ''}
                        onValueChange={(value) => onStatusChange(item.id, value)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          {service.statuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span>N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    {item.is_free_trial ? (
                      <Button variant="secondary" size="sm" onClick={() => onConvertTrial(item.id)} className="bg-orange-500 hover:bg-orange-600 text-white">
                        <RefreshCw className="mr-2 h-4 w-4" /> Chuyển đổi
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPay(item)}
                        disabled={item.unpaid_amount <= 0}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Thanh toán
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
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
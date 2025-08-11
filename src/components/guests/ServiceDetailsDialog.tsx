import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  services: any[];
}

export const ServiceDetailsDialog = ({ open, onOpenChange, guestName, services }: ServiceDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết dịch vụ đã bán</DialogTitle>
          <DialogDescription>Cho khách mời: {guestName}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên dịch vụ</TableHead>
                <TableHead>Giá</TableHead>
                <TableHead>Đã trả</TableHead>
                <TableHead>Còn lại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người giới thiệu</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length > 0 ? (
                services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.services.name}</TableCell>
                    <TableCell>{formatCurrency(service.price)}</TableCell>
                    <TableCell className="text-green-600">{formatCurrency(service.paid_amount)}</TableCell>
                    <TableCell className="text-red-600">{formatCurrency(service.price - service.paid_amount)}</TableCell>
                    <TableCell>{service.status || 'N/A'}</TableCell>
                    <TableCell>{service.referrer_name || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Không có dịch vụ nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestName: string;
  services: any[];
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export const ServiceDetailsDialog = ({ open, onOpenChange, guestName, services }: ServiceDetailsDialogProps) => {
  const isMobile = useIsMobile();

  const renderContent = () => {
    if (services.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center text-center text-slate-500">
          Không có dịch vụ nào.
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-3">
          {services.map((service) => (
            <Card key={service.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{service.service_name}</CardTitle>
                <CardDescription>{formatCurrency(service.price)}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <InfoRow label="Đã trả" value={formatCurrency(service.paid_amount)} valueClass="text-green-600" />
                <InfoRow label="Còn lại" value={formatCurrency(service.price - service.paid_amount)} valueClass="text-red-600" />
                <InfoRow label="Trạng thái" value={service.status || 'N/A'} />
                <InfoRow label="Người giới thiệu" value={service.referrer_name || 'N/A'} />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
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
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">{service.service_name}</TableCell>
              <TableCell>{formatCurrency(service.price)}</TableCell>
              <TableCell className="text-green-600">{formatCurrency(service.paid_amount)}</TableCell>
              <TableCell className="text-red-600">{formatCurrency(service.price - service.paid_amount)}</TableCell>
              <TableCell>{service.status || 'N/A'}</TableCell>
              <TableCell>{service.referrer_name || 'N/A'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết dịch vụ đã bán</DialogTitle>
          <DialogDescription>Cho khách mời: {guestName}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] mt-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
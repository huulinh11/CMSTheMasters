import { useState } from "react";
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
import { Service, GuestService } from "@/types/service-sales";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, RefreshCw, History } from "lucide-react";
import { PayServiceDialog } from "@/components/service-sales/PayServiceDialog";
import { Badge } from "@/components/ui/badge";
import GuestHistoryDialog from "../Revenue/GuestHistoryDialog";
import { GuestRevenue } from "@/types/guest-revenue";

interface ServiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestSummary: { guest_id: string; guest_name: string; services: GuestService[] } | null;
  allServices: Service[];
  onStatusChange: (id: string, status: string) => void;
  onConvertTrial: (id: string) => void;
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export const ServiceDetailsDialog = ({ open, onOpenChange, guestSummary, allServices, onStatusChange, onConvertTrial }: ServiceDetailsDialogProps) => {
  const isMobile = useIsMobile();
  const [payingItem, setPayingItem] = useState<GuestService | null>(null);
  const [historyGuest, setHistoryGuest] = useState<GuestRevenue | null>(null);

  if (!guestSummary) return null;

  const renderContent = () => {
    if (guestSummary.services.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center text-center text-slate-500">
          Không có dịch vụ nào.
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-3">
          {guestSummary.services.map((service) => {
            const serviceMaster = allServices.find(s => s.id === service.service_id);
            return (
              <Card key={service.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{service.service_name}</CardTitle>
                  <CardDescription>
                    {formatCurrency(service.price)}
                    {service.is_free_trial && <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">Free</Badge>}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <InfoRow label="Đã trả" value={formatCurrency(service.paid_amount)} valueClass="text-green-600" />
                  <InfoRow label="Còn lại" value={formatCurrency(service.unpaid_amount)} valueClass="text-red-600" />
                  <InfoRow label="Người giới thiệu" value={service.referrer_name || 'N/A'} />
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    {serviceMaster && serviceMaster.statuses.length > 0 ? (
                      <Select
                        value={service.status || ''}
                        onValueChange={(value) => onStatusChange(service.id, value)}
                      >
                        <SelectTrigger><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                        <SelectContent>{serviceMaster.statuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                      </Select>
                    ) : (<p className="text-sm text-muted-foreground">N/A</p>)}
                  </div>
                  <div className="flex gap-2 pt-2">
                    {service.is_free_trial ? (
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" variant="secondary" onClick={() => onConvertTrial(service.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Chuyển đổi
                      </Button>
                    ) : (
                      <Button className="flex-1" onClick={() => setPayingItem(service)} disabled={service.unpaid_amount <= 0}>
                        <CreditCard className="mr-2 h-4 w-4" /> Thanh toán
                      </Button>
                    )}
                    {service.payment_count > 0 && (
                      <Button className="flex-1" variant="secondary" onClick={() => setHistoryGuest({ id: guestSummary.guest_id, name: guestSummary.guest_name } as GuestRevenue)}>
                        <History className="mr-2 h-4 w-4" /> Lịch sử
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader><TableRow><TableHead>Tên dịch vụ</TableHead><TableHead>Giá</TableHead><TableHead>Đã trả</TableHead><TableHead>Còn lại</TableHead><TableHead>Trạng thái</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
        <TableBody>
          {guestSummary.services.map((service) => {
            const serviceMaster = allServices.find(s => s.id === service.service_id);
            return (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.service_name}{service.is_free_trial && <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">Free</Badge>}</TableCell>
                <TableCell>{formatCurrency(service.price)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(service.paid_amount)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(service.unpaid_amount)}</TableCell>
                <TableCell>
                  {serviceMaster && serviceMaster.statuses.length > 0 ? (
                    <Select value={service.status || ''} onValueChange={(value) => onStatusChange(service.id, value)}>
                      <SelectTrigger className="w-[150px]"><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger>
                      <SelectContent>{serviceMaster.statuses.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
                    </Select>
                  ) : (<span>N/A</span>)}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {service.payment_count > 0 && (<Button variant="outline" size="sm" onClick={() => setHistoryGuest({ id: guestSummary.guest_id, name: guestSummary.guest_name } as GuestRevenue)}>Lịch sử</Button>)}
                  {service.is_free_trial ? (
                    <Button variant="secondary" size="sm" onClick={() => onConvertTrial(service.id)} className="bg-orange-500 hover:bg-orange-600 text-white"><RefreshCw className="mr-2 h-4 w-4" /> Chuyển đổi</Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setPayingItem(service)} disabled={service.unpaid_amount <= 0}><CreditCard className="mr-2 h-4 w-4" /> Thanh toán</Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết dịch vụ đã bán</DialogTitle>
            <DialogDescription>Cho khách mời: {guestSummary.guest_name}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4">
            {renderContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <PayServiceDialog item={payingItem} open={!!payingItem} onOpenChange={() => setPayingItem(null)} />
      <GuestHistoryDialog guest={historyGuest} open={!!historyGuest} onOpenChange={() => setHistoryGuest(null)} />
    </>
  );
};
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/service-sales";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, RefreshCw, History, Trash2, MessageSquare } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { PayServiceDialog } from "@/components/service-sales/PayServiceDialog";
import { EditServiceNotesDialog } from "../service-sales/EditServiceNotesDialog";

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
  const queryClient = useQueryClient();
  const [payingItem, setPayingItem] = useState<any | null>(null);
  const [editingNotesService, setEditingNotesService] = useState<any | null>(null);

  const { data: allServices = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('guest_services').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      const guestId = services[0]?.guest_id;
      if (guestId) {
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'vip', guestId] });
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'regular', guestId] });
      }
      showSuccess("Cập nhật trạng thái thành công!");
    },
    onError: (err: Error) => showError(err.message),
  });

  const handleStatusChange = (id: string, status: string) => {
    statusUpdateMutation.mutate({ id, status });
  };

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
          {services.map((service) => {
            const serviceMaster = allServices.find(s => s.id === service.service_id);
            return (
              <Card key={service.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{service.service_name}</CardTitle>
                  <CardDescription>{formatCurrency(service.price)}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-3">
                  <InfoRow label="Đã trả" value={formatCurrency(service.paid_amount)} valueClass="text-green-600" />
                  <InfoRow label="Còn lại" value={formatCurrency(service.price - service.paid_amount)} valueClass="text-red-600" />
                  <InfoRow label="Người giới thiệu" value={service.referrer_name || 'N/A'} />
                  <div className="space-y-2">
                    <Label>Trạng thái</Label>
                    {serviceMaster && serviceMaster.statuses.length > 0 ? (
                      <Select
                        value={service.status || ''}
                        onValueChange={(value) => handleStatusChange(service.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn trạng thái" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceMaster.statuses.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground">N/A</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <Button
                      className="w-full"
                      onClick={() => setPayingItem(service)}
                      disabled={service.unpaid_amount <= 0}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      Thanh toán
                    </Button>
                    <Button className="w-full" variant="outline" onClick={() => setEditingNotesService(service)}>
                      <MessageSquare className="mr-2 h-4 w-4" /> {service.notes ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                    </Button>
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
        <TableHeader>
          <TableRow>
            <TableHead>Tên dịch vụ</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Đã trả</TableHead>
            <TableHead>Còn lại</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => {
            const serviceMaster = allServices.find(s => s.id === service.service_id);
            return (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.service_name}</TableCell>
                <TableCell>{formatCurrency(service.price)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(service.paid_amount)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(service.price - service.paid_amount)}</TableCell>
                <TableCell>
                  {serviceMaster && serviceMaster.statuses.length > 0 ? (
                    <Select
                      value={service.status || ''}
                      onValueChange={(value) => handleStatusChange(service.id, value)}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceMaster.statuses.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span>N/A</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditingNotesService(service)}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPayingItem(service)}
                    disabled={service.unpaid_amount <= 0}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán
                  </Button>
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
      <PayServiceDialog item={payingItem} open={!!payingItem} onOpenChange={() => setPayingItem(null)} />
      <EditServiceNotesDialog
        open={!!editingNotesService}
        onOpenChange={() => setEditingNotesService(null)}
        service={editingNotesService ? {
          id: editingNotesService.id,
          notes: editingNotesService.notes,
          serviceName: editingNotesService.service_name,
          guestName: guestName,
          guestId: editingNotesService.guest_id,
        } : null}
      />
    </>
  );
};
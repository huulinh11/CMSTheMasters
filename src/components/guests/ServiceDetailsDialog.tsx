import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/service-sales";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
                {service.notes && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md whitespace-pre-wrap">
                    <Label className="font-semibold text-slate-800">Ghi chú:</Label>
                    <p>{service.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    onClick={() => setPayingItem(service)}
                    disabled={service.unpaid_amount <= 0}
                  >
                    Thanh toán
                  </Button>
                  <Button className="flex-1" variant="outline" onClick={() => setEditingNotesService(service)}>
                    {service.notes ? 'Sửa Ghi chú' : 'Thêm Ghi chú'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết dịch vụ đã bán</DialogTitle>
            <DialogDescription>Cho khách mời: {guestName}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 p-1">
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
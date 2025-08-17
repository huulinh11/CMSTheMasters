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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service, GuestService, GuestServiceSummary } from "@/types/service-sales";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RefreshCw, History, Trash2 } from "lucide-react";
import { PayServiceDialog } from "@/components/service-sales/PayServiceDialog";
import { Badge } from "@/components/ui/badge";
import GuestHistoryDialog from "../Revenue/GuestHistoryDialog";
import { GuestRevenue } from "@/types/guest-revenue";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { showSuccess, showError } from "@/utils/toast";
import { EditServiceNotesDialog } from "./EditServiceNotesDialog";

interface ServiceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestSummary: GuestServiceSummary | null;
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
  const queryClient = useQueryClient();
  const [payingItem, setPayingItem] = useState<GuestService | null>(null);
  const [historyGuest, setHistoryGuest] = useState<GuestRevenue | null>(null);
  const [deletingService, setDeletingService] = useState<GuestService | null>(null);
  const [editingNotesService, setEditingNotesService] = useState<GuestService | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase.from('guest_services').delete().eq('id', serviceId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_service_details'] });
      if (guestSummary) {
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'vip', guestSummary.guest_id] });
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'regular', guestSummary.guest_id] });
      }
      showSuccess("Xóa dịch vụ thành công!");
      if (guestSummary?.services.length === 1) {
        onOpenChange(false);
      }
    },
    onError: (err: Error) => showError(err.message),
    onSettled: () => setDeletingService(null),
  });

  if (!guestSummary) return null;

  const { services, guest_name } = guestSummary;

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
              <CardHeader className="pb-2 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base">{service.service_name}</CardTitle>
                  <CardDescription>
                    {formatCurrency(service.price)}
                    {service.is_free_trial && <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">Free</Badge>}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingService(service);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <InfoRow label="Đã trả" value={formatCurrency(service.paid_amount)} valueClass="text-green-600" />
                <InfoRow label="Còn lại" value={formatCurrency(service.unpaid_amount)} valueClass="text-red-600" />
                <InfoRow label="Người giới thiệu" value={service.referrer_name || ''} />
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
                  ) : (<p className="text-sm text-muted-foreground">Trống</p>)}
                </div>
                {service.notes && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-2 rounded-md whitespace-pre-wrap">
                    <Label className="font-semibold text-slate-800">Ghi chú:</Label>
                    <p>{service.notes}</p>
                  </div>
                )}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    {service.is_free_trial ? (
                      <Button className="flex-1 bg-orange-500 hover:bg-orange-600 text-white" variant="secondary" onClick={() => onConvertTrial(service.id)}>
                        Chuyển đổi
                      </Button>
                    ) : (
                      <Button className="flex-1" onClick={() => setPayingItem(service)} disabled={service.unpaid_amount <= 0}>
                        Thanh toán
                      </Button>
                    )}
                    <Button className="flex-1" variant="outline" onClick={() => setEditingNotesService(service)}>
                      {service.notes ? 'Sửa ghi chú' : 'Thêm ghi chú'}
                    </Button>
                  </div>
                  {service.payment_count > 0 && (
                    <Button className="w-full" variant="secondary" onClick={() => setHistoryGuest({ id: guestSummary.guest_id, name: guestSummary.guest_name } as GuestRevenue)}>
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
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết dịch vụ đã bán</DialogTitle>
            <DialogDescription>Cho khách mời: {guest_name}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] mt-4 p-1">
            {renderContent()}
          </ScrollArea>
        </DialogContent>
      </Dialog>
      <PayServiceDialog item={payingItem} open={!!payingItem} onOpenChange={() => setPayingItem(null)} />
      <GuestHistoryDialog guest={historyGuest} open={!!historyGuest} onOpenChange={() => setHistoryGuest(null)} />
      <AlertDialog open={!!deletingService} onOpenChange={(isOpen) => !isOpen && setDeletingService(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa dịch vụ "{deletingService?.service_name}" cho khách mời {guest_name}. Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingService && deleteMutation.mutate(deletingService.id)}>Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditServiceNotesDialog
        open={!!editingNotesService}
        onOpenChange={() => setEditingNotesService(null)}
        service={editingNotesService ? {
          id: editingNotesService.id,
          notes: editingNotesService.notes,
          serviceName: editingNotesService.service_name,
          guestName: guest_name,
          guestId: guestSummary.guest_id,
        } : null}
      />
    </>
  );
};
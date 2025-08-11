import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import BillPreviewDialog from "./BillPreviewDialog";
import { Button } from "@/components/ui/button";

interface HistoryDialogProps {
  guest: VipGuestRevenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VipPaymentHistoryItem = {
  type: 'vip_payment';
  id: string;
  created_at: string;
  amount: number;
};

type ServicePaymentHistoryItem = {
  type: 'service_payment';
  id: string;
  created_at: string;
  amount: number;
  service_name: string;
  bill_image_url?: string | null;
};

type CombinedHistoryItem = VipPaymentHistoryItem | ServicePaymentHistoryItem;

const HistoryDialog = ({ guest, open, onOpenChange }: HistoryDialogProps) => {
  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);

  const { data: history = [], isLoading } = useQuery<CombinedHistoryItem[]>({
    queryKey: ['vip_guest_history', guest?.id],
    queryFn: async () => {
      if (!guest) return [];
      
      const vipPaymentsPromise = supabase.from('vip_payments').select('*').eq('guest_id', guest.id);
      
      const { data: guestServices, error: guestServicesError } = await supabase.from('guest_services').select('id, service_id').eq('guest_id', guest.id);
      if (guestServicesError) throw guestServicesError;

      const guestServiceIds = (guestServices || []).map(gs => gs.id);
      const servicePaymentsPromise = guestServiceIds.length > 0
        ? supabase.from('service_payments').select('*').in('guest_service_id', guestServiceIds)
        : Promise.resolve({ data: [], error: null });

      const serviceIds = (guestServices || []).map(s => s.service_id);
      let serviceNamesMap = new Map<string, string>();
      if (serviceIds.length > 0) {
        const { data: serviceDetails, error: serviceDetailsError } = await supabase.from('services').select('id, name').in('id', serviceIds);
        if (serviceDetailsError) throw serviceDetailsError;
        serviceNamesMap = new Map(serviceDetails.map(s => [s.id, s.name]));
      }
      const guestServiceIdToServiceIdMap = new Map((guestServices || []).map(gs => [gs.id, gs.service_id]));

      const [{ data: vipPayments, error: vipPaymentsError }, { data: servicePayments, error: servicePaymentsError }] = await Promise.all([vipPaymentsPromise, servicePaymentsPromise]);

      if (vipPaymentsError) throw vipPaymentsError;
      if (servicePaymentsError) throw servicePaymentsError;

      const vipPaymentHistory: CombinedHistoryItem[] = (vipPayments || []).map(p => ({ type: 'vip_payment', ...p }));
      const servicePaymentHistory: CombinedHistoryItem[] = (servicePayments || []).map(p => ({ type: 'service_payment', ...p, service_name: serviceNamesMap.get(guestServiceIdToServiceIdMap.get(p.guest_service_id) || '') || 'Dịch vụ không xác định' }));

      const combined = [...vipPaymentHistory, ...servicePaymentHistory];
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return combined;
    },
    enabled: !!guest && open,
  });

  if (!guest) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lịch sử thanh toán</DialogTitle>
            <DialogDescription>Cho khách mời: {guest.name}</DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Ngày thanh toán</TableHead><TableHead className="text-right">Số tiền</TableHead></TableRow></TableHeader>
                <TableBody>
                  {history.length > 0 ? (
                    history.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell className="text-right">
                          {item.type === 'vip_payment' ? (
                            <div className="font-medium">{formatCurrency(item.amount)}</div>
                          ) : (
                            <div>
                              <div className="font-medium">{formatCurrency(item.amount)}</div>
                              <div className="text-xs text-muted-foreground">{item.service_name}</div>
                              {item.bill_image_url && (
                                <Button variant="link" className="text-xs p-0 h-auto mt-1" onClick={() => setBillPreviewUrl(item.bill_image_url)}>Xem bill</Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={2} className="h-24 text-center">Chưa có thanh toán nào.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <BillPreviewDialog imageUrl={billPreviewUrl} open={!!billPreviewUrl} onOpenChange={() => setBillPreviewUrl(null)} />
    </>
  );
};

export default HistoryDialog;
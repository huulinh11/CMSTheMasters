import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestService } from "@/types/service-sales";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useState } from "react";
import BillPreviewDialog from "../Revenue/BillPreviewDialog";
import { Button } from "@/components/ui/button";

interface ServicePaymentHistoryDialogProps {
  item: GuestService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServicePaymentHistoryDialog = ({ item, open, onOpenChange }: ServicePaymentHistoryDialogProps) => {
  const [billPreviewUrl, setBillPreviewUrl] = useState<string | null>(null);

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['service_payments_history', item?.id],
    queryFn: async () => {
      if (!item) return [];
      const { data, error } = await supabase
        .from('service_payments')
        .select('*')
        .eq('guest_service_id', item.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!item && open,
  });

  if (!item) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lịch sử thanh toán</DialogTitle>
            <DialogDescription>
              {item.service_name} - {item.guest_name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Số tiền</TableHead>
                    <TableHead>Bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length > 0 ? (
                    payments.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{format(new Date(p.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                        <TableCell>{formatCurrency(p.amount)}</TableCell>
                        <TableCell>
                          {p.bill_image_url ? (
                            <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setBillPreviewUrl(p.bill_image_url)}>
                              Xem bill
                            </Button>
                          ) : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">Chưa có thanh toán nào.</TableCell>
                    </TableRow>
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
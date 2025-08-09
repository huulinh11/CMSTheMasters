import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { GuestRevenue } from "@/types/guest-revenue";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

interface GuestHistoryDialogProps {
  guest: GuestRevenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentHistoryItem = {
  type: 'payment';
  id: string;
  created_at: string;
  amount: number;
};

type UpsaleHistoryItem = {
  type: 'upsale';
  id: string;
  created_at: string;
  from_role: string;
  from_sponsorship: number;
  to_role: string;
  to_sponsorship: number;
  upsaled_by?: string | null;
  bill_image_url?: string | null;
};

type CombinedHistoryItem = PaymentHistoryItem | UpsaleHistoryItem;

const GuestHistoryDialog = ({ guest, open, onOpenChange }: GuestHistoryDialogProps) => {
  const { data: history = [], isLoading } = useQuery<CombinedHistoryItem[]>({
    queryKey: ['guest_history', guest?.id],
    queryFn: async () => {
      if (!guest) return [];
      
      const paymentsPromise = supabase
        .from('guest_payments')
        .select('id, created_at, amount')
        .eq('guest_id', guest.id);
        
      const upsaleHistoryPromise = supabase
        .from('guest_upsale_history')
        .select('id, created_at, from_role, to_role, from_sponsorship, to_sponsorship, upsaled_by, bill_image_url')
        .eq('guest_id', guest.id);

      const [{ data: payments, error: paymentsError }, { data: upsaleEvents, error: upsaleError }] = await Promise.all([paymentsPromise, upsaleHistoryPromise]);

      if (paymentsError) throw paymentsError;
      if (upsaleError) throw upsaleError;

      const paymentHistory: CombinedHistoryItem[] = (payments || []).map(p => ({
        type: 'payment',
        id: p.id,
        created_at: p.created_at,
        amount: p.amount,
      }));

      const upsaleHistory: CombinedHistoryItem[] = (upsaleEvents || []).map(u => ({
        type: 'upsale',
        id: u.id,
        created_at: u.created_at,
        from_role: u.from_role,
        from_sponsorship: u.from_sponsorship,
        to_role: u.to_role,
        to_sponsorship: u.to_sponsorship,
        upsaled_by: u.upsaled_by,
        bill_image_url: u.bill_image_url,
      }));

      const combined = [...paymentHistory, ...upsaleHistory];
      combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      return combined;
    },
    enabled: !!guest && open,
  });

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Lịch sử giao dịch</DialogTitle>
          <DialogDescription>
            Cho khách mời: {guest.name}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {item.type === 'payment' ? (
                          <div>
                            <div className="font-semibold">Thanh toán</div>
                            <div className="text-green-600 font-medium">{formatCurrency(item.amount)}</div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-blue-600">Upsale</div>
                            <div className="flex items-center text-sm flex-wrap">
                              <span>{item.from_role} ({formatCurrency(item.from_sponsorship)})</span>
                              <ArrowRight className="h-4 w-4 mx-2 text-muted-foreground" />
                              <span>{item.to_role} ({formatCurrency(item.to_sponsorship)})</span>
                            </div>
                            {item.upsaled_by && (
                              <div className="text-xs text-muted-foreground mt-1">
                                bởi {item.upsaled_by}
                              </div>
                            )}
                            {item.bill_image_url && (
                              <a href={item.bill_image_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline mt-1 inline-block">
                                Xem bill
                              </a>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                      Chưa có giao dịch nào.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GuestHistoryDialog;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { CommissionDetail } from "@/types/commission";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface CommissionDetailsDialogProps {
  referrerName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CommissionDetailsDialog = ({ referrerName, open, onOpenChange }: CommissionDetailsDialogProps) => {
  const { data: details = [], isLoading } = useQuery<CommissionDetail[]>({
    queryKey: ['commission_details_from_log', referrerName],
    queryFn: async () => {
      if (!referrerName) return [];
      const { data, error } = await supabase.rpc('get_commission_details', { referrer_name_in: referrerName });
      if (error) throw error;
      return data || [];
    },
    enabled: !!referrerName && open,
  });

  const totalCommission = details.reduce((sum, item) => sum + item.commission_earned, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết hoa hồng</DialogTitle>
          <DialogDescription>
            Cho người giới thiệu: {referrerName}
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
                  <TableHead>Tên người được giới thiệu</TableHead>
                  <TableHead>Số tiền tài trợ</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length > 0 ? (
                  details.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.referred_guest_name}</TableCell>
                      <TableCell>{formatCurrency(item.sponsorship_amount)}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(item.commission_earned)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Không có dữ liệu chi tiết.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={2} className="font-bold">Tổng hoa hồng</TableCell>
                  <TableCell className="text-right font-bold">{formatCurrency(totalCommission)}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommissionDetailsDialog;
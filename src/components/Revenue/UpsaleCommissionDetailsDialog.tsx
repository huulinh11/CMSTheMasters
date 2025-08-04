import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { UpsaleCommissionDetail } from "@/types/commission";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface UpsaleCommissionDetailsDialogProps {
  upsalePersonName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpsaleCommissionDetailsDialog = ({ upsalePersonName, open, onOpenChange }: UpsaleCommissionDetailsDialogProps) => {
  const { data: details = [], isLoading } = useQuery<UpsaleCommissionDetail[]>({
    queryKey: ['upsale_commission_details_from_log', upsalePersonName],
    queryFn: async () => {
      if (!upsalePersonName) return [];
      const { data, error } = await supabase.rpc('get_upsale_commission_details', { upsaled_by_in: upsalePersonName });
      if (error) throw error;
      return data || [];
    },
    enabled: !!upsalePersonName && open,
  });

  const totalCommission = details.reduce((sum, item) => sum + item.commission_earned, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết hoa hồng Upsale</DialogTitle>
          <DialogDescription>
            Cho nhân viên: {upsalePersonName}
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
                  <TableHead>Tên khách được upsale</TableHead>
                  <TableHead>Số tiền upsale</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length > 0 ? (
                  details.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.upsaled_guest_name}</TableCell>
                      <TableCell>{formatCurrency(item.upsale_amount)}</TableCell>
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

export default UpsaleCommissionDetailsDialog;
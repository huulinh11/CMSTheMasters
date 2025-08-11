import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCommissionDetail } from "@/types/service-sales";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface ServiceCommissionDetailsDialogProps {
  referrer: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceCommissionDetailsDialog = ({ referrer, open, onOpenChange }: ServiceCommissionDetailsDialogProps) => {
  const { data: details = [], isLoading } = useQuery<ServiceCommissionDetail[]>({
    queryKey: ['service_commission_details', referrer?.id],
    queryFn: async () => {
      if (!referrer) return [];
      const { data, error } = await supabase.rpc('get_service_commission_details', { referrer_id_in: referrer.id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!referrer && open,
  });

  const totalCommission = details.reduce((sum, item) => sum + item.commission_earned, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Chi tiết hoa hồng dịch vụ</DialogTitle>
          <DialogDescription>
            Cho người giới thiệu: {referrer?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Dịch vụ</TableHead>
                  <TableHead className="text-right">Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length > 0 ? (
                  details.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.guest_name}</TableCell>
                      <TableCell>{item.service_name}</TableCell>
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
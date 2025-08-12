import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ServiceCommissionDetail } from "@/types/service-sales";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface ServiceCommissionDetailsDialogProps {
  referrer: { id: string; name: string; hideCommission?: boolean } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceCommissionDetailsDialog = ({ referrer, open, onOpenChange }: ServiceCommissionDetailsDialogProps) => {
  const isMobile = useIsMobile();
  const hideCommission = referrer?.hideCommission;

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

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="h-64 w-full" />;
    }

    if (details.length === 0) {
      return (
        <div className="h-24 flex items-center justify-center text-center text-slate-500">
          Không có dữ liệu chi tiết.
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="space-y-3">
          {details.map((item, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.guest_name}</CardTitle>
                <p className="text-xs text-slate-500">{item.service_name}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Giá dịch vụ:</span>
                  <span className="font-medium">{formatCurrency(item.service_price)}</span>
                </div>
                {!hideCommission && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hoa hồng:</span>
                    <span className="font-bold text-green-600">{formatCurrency(item.commission_earned)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Dịch vụ</TableHead>
            <TableHead>Giá dịch vụ</TableHead>
            {!hideCommission && <TableHead className="text-right">Hoa hồng</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.guest_name}</TableCell>
              <TableCell>{item.service_name}</TableCell>
              <TableCell>{formatCurrency(item.service_price)}</TableCell>
              {!hideCommission && <TableCell className="text-right font-medium">{formatCurrency(item.commission_earned)}</TableCell>}
            </TableRow>
          ))}
        </TableBody>
        {!hideCommission && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-bold">Tổng hoa hồng</TableCell>
              <TableCell className="text-right font-bold">{formatCurrency(totalCommission)}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết hoa hồng dịch vụ</DialogTitle>
          <DialogDescription>
            Cho người giới thiệu: {referrer?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
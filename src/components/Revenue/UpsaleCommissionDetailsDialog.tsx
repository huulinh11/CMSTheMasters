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
import { UpsaleCommissionDetail } from "@/types/commission";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { ArrowRight } from "lucide-react";

interface UpsaleCommissionDetailsDialogProps {
  person: { userId: string; name: string; hideCommission: boolean; } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpsaleCommissionDetailsDialog = ({ person, open, onOpenChange }: UpsaleCommissionDetailsDialogProps) => {
  const isMobile = useIsMobile();
  const hideCommission = person?.hideCommission;

  const { data: details = [], isLoading } = useQuery<UpsaleCommissionDetail[]>({
    queryKey: ['upsale_commission_details_from_log', person?.userId],
    queryFn: async () => {
      if (!person?.userId) return [];
      const { data, error } = await supabase.rpc('get_upsale_commission_details', { upsaled_by_user_id_in: person.userId });
      if (error) throw error;
      return data || [];
    },
    enabled: !!person && open,
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
                <CardTitle className="text-base">{item.upsaled_guest_name}</CardTitle>
                <p className="text-xs text-slate-500">{format(new Date(item.upsale_date), 'dd/MM/yyyy HH:mm')}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Vai trò:</span>
                  <span className="font-medium flex items-center gap-1">{item.from_role} <ArrowRight className="h-3 w-3" /> {item.to_role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền upsale:</span>
                  <span className="font-medium">{formatCurrency(item.upsale_amount)}</span>
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
            <TableHead>Khách</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Tiền upsale</TableHead>
            {!hideCommission && <TableHead className="text-right">Hoa hồng</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.upsaled_guest_name}</TableCell>
              <TableCell className="flex items-center gap-1">{item.from_role} <ArrowRight className="h-3 w-3" /> {item.to_role}</TableCell>
              <TableCell>{formatCurrency(item.upsale_amount)}</TableCell>
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
          <DialogTitle>Chi tiết hoa hồng Upsale</DialogTitle>
          <DialogDescription>
            Cho nhân viên: {person?.name}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpsaleCommissionDetailsDialog;
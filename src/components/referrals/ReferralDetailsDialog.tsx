import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { ReferrerSummary, ReferredGuestDetail } from "@/types/referrals";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

interface ReferralDetailsDialogProps {
  referrer: ReferrerSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferralDetailsDialog = ({ referrer, open, onOpenChange }: ReferralDetailsDialogProps) => {
  const isMobile = useIsMobile();
  const { data: details = [], isLoading } = useQuery<ReferredGuestDetail[]>({
    queryKey: ['referred_guest_details', referrer?.referrer_id],
    queryFn: async () => {
      if (!referrer) return [];
      const { data, error } = await supabase.rpc('get_all_referred_guests_details', { referrer_id_in: referrer.referrer_id });
      if (error) throw error;
      return data || [];
    },
    enabled: !!referrer && open,
  });

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
          {details.map(item => (
            <Card key={item.guest_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{item.guest_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.guest_role}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền tài trợ:</span>
                  <span className="font-medium">{formatCurrency(item.sponsorship_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hoa hồng:</span>
                  {item.is_commissionable ? (
                    <span className="font-bold text-green-600">{formatCurrency(item.commission_earned)}</span>
                  ) : (
                    <span className="text-slate-500">Không có</span>
                  )}
                </div>
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
            <TableHead>Tên khách mời</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Tiền tài trợ</TableHead>
            <TableHead>Hoa hồng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((item) => (
            <TableRow key={item.guest_id}>
              <TableCell className="font-medium">{item.guest_name}</TableCell>
              <TableCell>{item.guest_role}</TableCell>
              <TableCell>{formatCurrency(item.sponsorship_amount)}</TableCell>
              <TableCell>
                {item.is_commissionable ? (
                  <Badge variant="default" className="bg-green-100 text-green-800">{formatCurrency(item.commission_earned)}</Badge>
                ) : (
                  <Badge variant="outline">Không có</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết giới thiệu</DialogTitle>
          <DialogDescription>
            Danh sách khách mời được giới thiệu bởi {referrer?.referrer_name}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
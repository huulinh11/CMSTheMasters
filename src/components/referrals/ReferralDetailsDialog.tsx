import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { ReferrerSummary, ReferredGuestDetail } from "@/types/referrals";
import { Badge } from "@/components/ui/badge";

interface ReferralDetailsDialogProps {
  referrer: ReferrerSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferralDetailsDialog = ({ referrer, open, onOpenChange }: ReferralDetailsDialogProps) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chi tiết giới thiệu</DialogTitle>
          <DialogDescription>
            Danh sách khách mời được giới thiệu bởi {referrer?.referrer_name}
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
                  <TableHead>Tên khách mời</TableHead>
                  <TableHead>Vai trò</TableHead>
                  <TableHead>Tiền tài trợ</TableHead>
                  <TableHead>Hoa hồng</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length > 0 ? (
                  details.map((item) => (
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Không có dữ liệu.
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
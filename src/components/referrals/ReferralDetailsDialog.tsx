import { useState } from "react";
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
import { GuestDetailsDialog } from "@/components/guests/GuestDetailsDialog";
import { RoleConfiguration } from "@/types/role-configuration";
import { showNotice } from "@/utils/toast";

interface ReferralDetailsDialogProps {
  referrer: ReferrerSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReferralDetailsDialog = ({ referrer, open, onOpenChange }: ReferralDetailsDialogProps) => {
  const isMobile = useIsMobile();
  const [viewingGuestId, setViewingGuestId] = useState<string | null>(null);

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

  const { data: roleConfigs = [] } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations_for_details_dialog'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const handleViewGuest = (guestId: string) => {
    setViewingGuestId(guestId);
  };

  const handleEditGuest = () => {
    showNotice("Vui lòng sửa thông tin khách mời từ trang Quản lý khách mời.");
  };

  const handleDeleteGuest = () => {
    showNotice("Vui lòng xóa khách mời từ trang Quản lý khách mời.");
  };

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
            <Card key={item.guest_id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center">
                  <span className="text-sm font-normal text-slate-500 mr-2">{index + 1}.</span>
                  <button onClick={() => handleViewGuest(item.guest_id)} className="text-left hover:underline">
                    {item.guest_name}
                  </button>
                </CardTitle>
                <p className="text-sm text-muted-foreground pl-6">{item.guest_role}</p>
              </CardHeader>
              <CardContent className="text-sm space-y-1 pl-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tiền tài trợ:</span>
                  <span className="font-medium">{formatCurrency(item.sponsorship_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Hoa hồng:</span>
                  {item.commission_earned > 0 ? (
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
            <TableHead className="w-[50px]">STT</TableHead>
            <TableHead>Tên khách mời</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Tiền tài trợ</TableHead>
            <TableHead>Hoa hồng</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {details.map((item, index) => (
            <TableRow key={item.guest_id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                <button onClick={() => handleViewGuest(item.guest_id)} className="text-left hover:underline">
                  {item.guest_name}
                </button>
              </TableCell>
              <TableCell>{item.guest_role}</TableCell>
              <TableCell>{formatCurrency(item.sponsorship_amount)}</TableCell>
              <TableCell>
                {item.commission_earned > 0 ? (
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
    <>
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
      <GuestDetailsDialog
        guestId={viewingGuestId}
        guestType="regular"
        open={!!viewingGuestId}
        onOpenChange={(isOpen) => !isOpen && setViewingGuestId(null)}
        onEdit={handleEditGuest}
        onDelete={handleDeleteGuest}
        roleConfigs={roleConfigs}
      />
    </>
  );
};
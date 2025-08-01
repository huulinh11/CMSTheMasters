import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, History } from "lucide-react";
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { formatCurrency } from "@/lib/utils";
import { VIP_ROLE_COLORS } from "@/lib/role-colors";

interface VipRevenueCardsProps {
  guests: VipGuestRevenue[];
  onPay: (guest: VipGuestRevenue) => void;
  onHistory: (guest: VipGuestRevenue) => void;
  onEdit: (guest: VipGuestRevenue) => void;
  onView: (guest: VipGuestRevenue) => void;
}

export const VipRevenueCards = ({
  guests,
  onPay,
  onHistory,
  onEdit,
  onView,
}: VipRevenueCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between pb-2">
              <button onClick={() => onView(guest)} className="text-left pr-2">
                <CardTitle className="text-lg font-semibold text-slate-800 hover:underline">{guest.name}</CardTitle>
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onHistory(guest)}>
                    <History className="mr-2 h-4 w-4" /> Lịch sử
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit(guest)}>
                    <Edit className="mr-2 h-4 w-4" /> Sửa tài trợ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center text-sm">
                <span className={`px-2 py-1 rounded-md font-medium ${VIP_ROLE_COLORS[guest.role as keyof typeof VIP_ROLE_COLORS]}`}>
                  {guest.role}
                </span>
                <span className="text-slate-500 ml-1.5">({guest.id})</span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-slate-600">
                <InfoRow label="Tài trợ" value={formatCurrency(guest.sponsorship)} />
                <InfoRow label="Đã thanh toán" value={formatCurrency(guest.paid)} valueClass="text-green-600" />
                <InfoRow label="Chưa thanh toán" value={formatCurrency(guest.unpaid)} valueClass="text-red-600" />
                {guest.referrer && <InfoRow label="Người giới thiệu" value={guest.referrer} />}
              </div>
              <Button className="w-full" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}>
                Thanh toán
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Không tìm thấy dữ liệu.</p>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit, History, TrendingUp } from "lucide-react";
import { GuestRevenue } from "@/types/guest-revenue";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { RoleConfiguration } from "@/types/role-configuration";

interface RegularRevenueCardsProps {
  guests: GuestRevenue[];
  onPay: (guest: GuestRevenue) => void;
  onHistory: (guest: GuestRevenue) => void;
  onEdit: (guest: GuestRevenue) => void;
  onUpsale: (guest: GuestRevenue) => void;
  onView: (guest: GuestRevenue) => void;
  roleConfigs: RoleConfiguration[];
}

export const RegularRevenueCards = ({
  guests,
  onPay,
  onHistory,
  onEdit,
  onUpsale,
  onView,
  roleConfigs,
}: RegularRevenueCardsProps) => {

  const getRoleColors = (roleName: string) => {
    const config = roleConfigs.find(rc => rc.name === roleName);
    return {
      backgroundColor: config?.bg_color || '#EFF6FF',
      color: config?.text_color || '#1E40AF',
    };
  };

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
                <span 
                  className="px-2 py-1 rounded-md font-medium"
                  style={getRoleColors(guest.role)}
                >
                  {guest.role}
                </span>
                <span className="text-slate-500 ml-1.5">({guest.id})</span>
              </div>
              <div className="border-t border-slate-100 pt-3 space-y-2 text-slate-600">
                <InfoRow label="Tài trợ" value={formatCurrency(guest.sponsorship)} valueClass={cn(guest.is_upsaled && "text-red-600 font-bold")} />
                <InfoRow label="Đã thanh toán" value={formatCurrency(guest.paid)} valueClass="text-green-600" />
                <InfoRow label="Chưa thanh toán" value={formatCurrency(guest.unpaid)} valueClass="text-red-600" />
                <InfoRow label="Nguồn thanh toán" value={guest.payment_source || "Trống"} />
                {guest.referrer && <InfoRow label="Người giới thiệu" value={guest.referrer} />}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="outline" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}>
                  Thanh toán
                </Button>
                <Button className="flex-1" onClick={() => onUpsale(guest)}>
                  <TrendingUp className="mr-2 h-4 w-4" /> Upsale
                </Button>
              </div>
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
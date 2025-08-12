import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CombinedGuestRevenue } from "@/pages/Revenue";
import { formatCurrency } from "@/lib/utils";
import { Edit, CreditCard, History, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CombinedRevenueCardsProps {
  guests: CombinedGuestRevenue[];
  onView: (guest: CombinedGuestRevenue) => void;
  onEdit: (guest: CombinedGuestRevenue) => void;
  onPay: (guest: CombinedGuestRevenue) => void;
  onHistory: (guest: CombinedGuestRevenue) => void;
  onUpsale: (guest: CombinedGuestRevenue) => void;
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export const CombinedRevenueCards = ({ guests, onView, onEdit, onPay, onHistory, onUpsale }: CombinedRevenueCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  <button onClick={() => onView(guest)} className="text-left hover:underline">
                    {guest.name}
                  </button>
                </CardTitle>
                <p className="text-sm text-slate-500">{guest.role} ({guest.id})</p>
              </div>
              <Avatar>
                <AvatarImage src={guest.image_url || ''} alt={guest.name} />
                <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
              </Avatar>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Tài trợ</span>
                  {guest.type === 'Khách mời' && guest.is_upsaled ? (
                    <span className="bg-red-600 text-white font-bold px-2 py-1 rounded-md text-xs">
                      {formatCurrency(guest.sponsorship)}
                    </span>
                  ) : (
                    <span className="font-medium text-slate-800">{formatCurrency(guest.sponsorship)}</span>
                  )}
                </div>
                <InfoRow label="Tiền dịch vụ" value={formatCurrency(guest.service_revenue)} />
                <InfoRow label="Tổng tiền" value={formatCurrency(guest.total_revenue)} valueClass="font-bold text-primary" />
                <InfoRow label="Đã thanh toán" value={formatCurrency(guest.paid)} valueClass="text-green-600" />
                <InfoRow label="Chưa thanh toán" value={formatCurrency(guest.unpaid)} valueClass="text-red-600" />
                {guest.type === 'Khách mời' && <InfoRow label="Nguồn TT" value={guest.payment_source || 'N/A'} />}
                {guest.referrer && <InfoRow label="Người giới thiệu" value={guest.referrer} />}
                {guest.type === 'Khách mời' && guest.is_upsaled && (
                  <InfoRow label="Trạng thái" value="Đã upsale" valueClass="text-red-500 font-semibold" />
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="outline" size="sm" onClick={() => onEdit(guest)}><Edit className="mr-2 h-4 w-4" /> Sửa</Button>
                <Button className="flex-1" size="sm" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}><CreditCard className="mr-2 h-4 w-4" /> Thanh toán</Button>
              </div>
              <div className="flex gap-2">
                {guest.has_history && (
                  <Button className="flex-1" variant="secondary" size="sm" onClick={() => onHistory(guest)}><History className="mr-2 h-4 w-4" /> Lịch sử</Button>
                )}
                {guest.type === 'Khách mời' && (
                  <Button className="flex-1" variant="secondary" size="sm" onClick={() => onUpsale(guest)}><TrendingUp className="mr-2 h-4 w-4" /> Upsale</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Không tìm thấy khách mời nào.</p>
        </div>
      )}
    </div>
  );
};
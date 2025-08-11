import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CombinedGuestRevenue } from "@/pages/Revenue";
import { formatCurrency } from "@/lib/utils";
import { Eye, Edit, CreditCard, History, TrendingUp } from "lucide-react";

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
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-slate-800">{guest.name}</CardTitle>
              <p className="text-sm text-slate-500">{guest.role} ({guest.id})</p>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <InfoRow label="Tài trợ" value={formatCurrency(guest.sponsorship)} />
                <InfoRow label="Đã thanh toán" value={formatCurrency(guest.paid)} valueClass="text-green-600" />
                <InfoRow label="Chưa thanh toán" value={formatCurrency(guest.unpaid)} valueClass="text-red-600" />
                {guest.type === 'Khách mời' && <InfoRow label="Nguồn TT" value={guest.payment_source || 'N/A'} />}
              </div>
              <div className="flex gap-2 pt-2">
                <Button className="flex-1" variant="outline" size="sm" onClick={() => onView(guest)}><Eye className="mr-2 h-4 w-4" /> Xem</Button>
                <Button className="flex-1" variant="outline" size="sm" onClick={() => onEdit(guest)}><Edit className="mr-2 h-4 w-4" /> Sửa</Button>
                <Button className="flex-1" size="sm" onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}><CreditCard className="mr-2 h-4 w-4" /> TT</Button>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" variant="secondary" size="sm" onClick={() => onHistory(guest)}><History className="mr-2 h-4 w-4" /> Lịch sử</Button>
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
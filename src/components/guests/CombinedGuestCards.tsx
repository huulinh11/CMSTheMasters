import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Edit, CreditCard, History, TrendingUp, Trash2, MoreVertical } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CombinedGuestRevenue } from "@/pages/Guests";

interface CombinedGuestCardsProps {
  guests: CombinedGuestRevenue[];
  selectedGuests: string[];
  onSelectGuest: (id: string) => void;
  onView: (guest: CombinedGuestRevenue) => void;
  onEdit: (guest: CombinedGuestRevenue) => void;
  onPay: (guest: CombinedGuestRevenue) => void;
  onHistory: (guest: CombinedGuestRevenue) => void;
  onUpsale: (guest: CombinedGuestRevenue) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export const CombinedGuestCards = ({ guests, selectedGuests, onSelectGuest, onView, onEdit, onPay, onHistory, onUpsale, onDelete, canDelete }: CombinedGuestCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <div className="flex items-center gap-3 flex-grow min-w-0">
                <Checkbox
                  checked={selectedGuests.includes(guest.id)}
                  onCheckedChange={() => onSelectGuest(guest.id)}
                  className="flex-shrink-0"
                />
                <Avatar>
                  <AvatarImage src={guest.image_url || ''} alt={guest.name} />
                  <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                  <CardTitle className="text-base font-semibold text-slate-800 truncate">
                    <button onClick={() => onView(guest)} className="text-left hover:underline">
                      {guest.name}
                    </button>
                  </CardTitle>
                  <p className="text-sm text-slate-500">{guest.role} ({guest.type})</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(guest)}><Edit className="mr-2 h-4 w-4" /> Sửa</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPay(guest)} disabled={guest.unpaid <= 0}><CreditCard className="mr-2 h-4 w-4" /> Thanh toán</DropdownMenuItem>
                  {guest.has_history && <DropdownMenuItem onClick={() => onHistory(guest)}><History className="mr-2 h-4 w-4" /> Lịch sử</DropdownMenuItem>}
                  {guest.type === 'Khách mời' && <DropdownMenuItem onClick={() => onUpsale(guest)}><TrendingUp className="mr-2 h-4 w-4" /> Upsale</DropdownMenuItem>}
                  {canDelete && <DropdownMenuItem onClick={() => onDelete(guest.id)} className="text-red-600"><Trash2 className="mr-2 h-4 w-4" /> Xóa</DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <InfoRow label="SĐT" value={guest.phone || 'N/A'} />
                <InfoRow label="Thông tin phụ" value={(guest.type === 'Chức vụ' ? guest.secondaryInfo : '') || 'N/A'} />
                <InfoRow label="Người GT" value={guest.referrer || 'N/A'} />
                <InfoRow label="Ghi chú" value={guest.notes || 'N/A'} />
                <InfoRow label="Tài trợ" value={formatCurrency(guest.sponsorship)} />
                <InfoRow label="Đã thanh toán" value={formatCurrency(guest.paid)} valueClass="text-green-600" />
                <InfoRow label="Chưa thanh toán" value={formatCurrency(guest.unpaid)} valueClass="text-red-600" />
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
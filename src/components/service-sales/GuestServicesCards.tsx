import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GuestService, Service } from "@/types/service-sales";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, RefreshCw, History } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface GuestServicesCardsProps {
  items: GuestService[];
  services: Service[];
  onStatusChange: (id: string, status: string) => void;
  onPay: (item: GuestService) => void;
  onConvertTrial: (id: string) => void;
  onViewGuest: (guest: GuestService) => void;
  onHistory: (item: GuestService) => void;
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export const GuestServicesCards = ({ items, services, onStatusChange, onPay, onConvertTrial, onViewGuest, onHistory }: GuestServicesCardsProps) => {
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const service = services.find(s => s.id === item.service_id);
        return (
          <Card key={item.id}>
            <CardHeader>
              <button onClick={() => onViewGuest(item)} className="text-left hover:underline">
                <CardTitle>{item.guest_name}</CardTitle>
              </button>
              <p className="text-sm text-muted-foreground">
                {item.service_name}
                {item.is_free_trial && <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-800 border-orange-200">Free</Badge>}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Giá" value={formatCurrency(item.price)} />
              <InfoRow label="Đã trả" value={formatCurrency(item.paid_amount)} valueClass="text-green-600" />
              <InfoRow label="Còn lại" value={formatCurrency(item.unpaid_amount)} valueClass="text-red-600" />
              <InfoRow label="Người giới thiệu" value={item.referrer_name || 'N/A'} />
              <div className="space-y-2">
                <Label>Trạng thái</Label>
                {service && service.statuses.length > 0 ? (
                  <Select
                    value={item.status || ''}
                    onValueChange={(value) => onStatusChange(item.id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      {service.statuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">N/A</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                {item.is_free_trial ? (
                  <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" variant="secondary" onClick={() => onConvertTrial(item.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Chuyển đổi
                  </Button>
                ) : (
                  <Button
                    className="flex-1"
                    onClick={() => onPay(item)}
                    disabled={item.unpaid_amount <= 0}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Thanh toán
                  </Button>
                )}
                {item.payment_count > 0 && (
                  <Button className="flex-1" variant="secondary" onClick={() => onHistory(item)}>
                    <History className="mr-2 h-4 w-4" /> Lịch sử TT
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
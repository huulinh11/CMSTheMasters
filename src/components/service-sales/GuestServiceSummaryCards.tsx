import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GuestServiceSummary } from "@/types/service-sales";
import { formatCurrency } from "@/lib/utils";
import { Eye, History, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

interface GuestServiceSummaryCardsProps {
  summaries: GuestServiceSummary[];
  onViewDetails: (summary: GuestServiceSummary) => void;
  onHistory: (summary: GuestServiceSummary) => void;
  onConvertTrial: (serviceId: string) => void;
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export const GuestServiceSummaryCards = ({ summaries, onViewDetails, onHistory, onConvertTrial }: GuestServiceSummaryCardsProps) => {
  return (
    <div className="space-y-4">
      {summaries.map((summary) => {
        const hasPaymentHistory = summary.services.some(s => s.payment_count > 0);
        const freeTrialServices = summary.services.filter(s => s.is_free_trial);
        const hasFreeTrial = freeTrialServices.length > 0;
        const canDirectlyConvert = freeTrialServices.length === 1;

        return (
          <Card key={summary.guest_id}>
            <CardHeader>
              <CardTitle>{summary.guest_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{summary.guest_phone}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Dịch vụ</Label>
                <div className="flex flex-wrap gap-1">
                  {summary.services.map(s => (
                    <Badge key={s.id} variant={s.is_free_trial ? "destructive" : "secondary"}>{s.service_name}</Badge>
                  ))}
                </div>
              </div>
              <InfoRow label="Tổng tiền" value={formatCurrency(summary.total_revenue)} />
              <InfoRow label="Đã trả" value={formatCurrency(summary.total_paid)} valueClass="text-green-600" />
              <InfoRow label="Còn lại" value={formatCurrency(summary.total_unpaid)} valueClass="text-red-600" />
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex gap-2">
                  {hasPaymentHistory && (
                    <Button className="flex-1" variant="secondary" onClick={() => onHistory(summary)}>
                      <History className="mr-2 h-4 w-4" /> Lịch sử TT
                    </Button>
                  )}
                  <Button className="flex-1" onClick={() => onViewDetails(summary)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Chi tiết
                  </Button>
                </div>
                {hasFreeTrial && (
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      if (canDirectlyConvert) {
                        onConvertTrial(freeTrialServices[0].id);
                      } else {
                        onViewDetails(summary);
                      }
                    }}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" /> Chuyển đổi
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
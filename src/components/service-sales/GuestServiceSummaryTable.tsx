import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GuestServiceSummary } from "@/types/service-sales";
import { formatCurrency } from "@/lib/utils";
import { Eye, History, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface GuestServiceSummaryTableProps {
  summaries: GuestServiceSummary[];
  onViewDetails: (summary: GuestServiceSummary) => void;
  onHistory: (summary: GuestServiceSummary) => void;
  onConvertTrial: (serviceId: string) => void;
}

export const GuestServiceSummaryTable = ({ summaries, onViewDetails, onHistory, onConvertTrial }: GuestServiceSummaryTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ảnh</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Dịch vụ</TableHead>
            <TableHead>Tổng tiền</TableHead>
            <TableHead>Đã trả</TableHead>
            <TableHead>Còn lại</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summaries.length > 0 ? (
            summaries.map((summary) => {
              const hasPaymentHistory = summary.services.some(s => s.payment_count > 0);
              const freeTrialServices = summary.services.filter(s => s.is_free_trial);
              const hasFreeTrial = freeTrialServices.length > 0;
              const canDirectlyConvert = freeTrialServices.length === 1;

              return (
                <TableRow key={summary.guest_id}>
                  <TableCell>
                    <Avatar>
                      <AvatarImage src={summary.image_url || ''} alt={summary.guest_name} />
                      <AvatarFallback>{summary.guest_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{summary.guest_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {summary.guest_phone ? (
                        <a href={`tel:${summary.guest_phone}`} className="hover:underline">{summary.guest_phone}</a>
                      ) : (
                        ''
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {summary.services.map(s => (
                        <Badge key={s.id} variant={s.is_free_trial ? "destructive" : "secondary"}>{s.service_name}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(summary.total_revenue)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(summary.total_paid)}</TableCell>
                  <TableCell className="text-red-600">{formatCurrency(summary.total_unpaid)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {hasPaymentHistory && (
                      <Button variant="outline" size="sm" onClick={() => onHistory(summary)}>
                        <History className="mr-2 h-4 w-4" />
                        Lịch sử TT
                      </Button>
                    )}
                    {hasFreeTrial && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={() => {
                          if (canDirectlyConvert) {
                            onConvertTrial(freeTrialServices[0].id);
                          } else {
                            onViewDetails(summary);
                          }
                        }}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Chuyển đổi
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => onViewDetails(summary)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Không có dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
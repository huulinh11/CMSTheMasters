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
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GuestServiceSummaryTableProps {
  summaries: GuestServiceSummary[];
  onViewDetails: (summary: GuestServiceSummary) => void;
}

export const GuestServiceSummaryTable = ({ summaries, onViewDetails }: GuestServiceSummaryTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
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
            summaries.map((summary) => (
              <TableRow key={summary.guest_id}>
                <TableCell>
                  <div className="font-medium">{summary.guest_name}</div>
                  <div className="text-sm text-muted-foreground">{summary.guest_phone}</div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 items-start">
                    {summary.services.map(s => (
                      <Badge key={s.id} variant="secondary">{s.service_name}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(summary.total_revenue)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(summary.total_paid)}</TableCell>
                <TableCell className="text-red-600">{formatCurrency(summary.total_unpaid)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(summary)}>
                    <Eye className="mr-2 h-4 w-4" />
                    Xem chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Không có dữ liệu.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
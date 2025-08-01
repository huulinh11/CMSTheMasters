import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommissionSummary } from "@/types/commission";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CommissionDetailsDialog from "@/components/Revenue/CommissionDetailsDialog";

const CommissionTab = () => {
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);

  const { data: summary = [], isLoading } = useQuery<CommissionSummary[]>({
    queryKey: ['commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_commission_summary');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const handleViewDetails = (referrerName: string) => {
    setSelectedReferrer(referrerName);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      {isMobile ? (
        <div className="space-y-4">
          {summary.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{item.referrer_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Số tiền tính hoa hồng" value={formatCurrency(item.total_commissionable_amount)} />
                <InfoRow label="Tổng hoa hồng" value={formatCurrency(item.total_commission)} valueClass="text-green-600 font-bold" />
                <Button className="w-full mt-2" onClick={() => handleViewDetails(item.referrer_name)}>
                  Xem chi tiết
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead>Tên</TableHead>
                <TableHead>Số tiền tính hoa hồng</TableHead>
                <TableHead>Tổng hoa hồng</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.referrer_name}</TableCell>
                  <TableCell>{formatCurrency(item.total_commissionable_amount)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetails(item.referrer_name)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <CommissionDetailsDialog
        referrerName={selectedReferrer}
        open={!!selectedReferrer}
        onOpenChange={(open) => !open && setSelectedReferrer(null)}
      />
    </div>
  );
};

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

export default CommissionTab;
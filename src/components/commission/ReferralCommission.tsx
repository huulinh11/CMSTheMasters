import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommissionSummary } from "@/types/commission";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CommissionDetailsDialog from "@/components/Revenue/CommissionDetailsDialog";

const ReferralCommission = () => {
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: summaryData = [], isLoading } = useQuery<CommissionSummary[]>({
    queryKey: ['referral_commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('referral_commission_summary').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const filteredSummary = useMemo(() => {
    return summaryData.filter(item => 
      item.referrer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [summaryData, searchTerm]);

  const totalStats = useMemo(() => {
    return filteredSummary.reduce((acc, item) => {
        acc.totalCommissionableAmount += item.total_commissionable_amount;
        acc.totalReferrals += item.commissionable_referrals_count;
        acc.totalCommission += item.total_commission;
        return acc;
    }, { totalCommissionableAmount: 0, totalReferrals: 0, totalCommission: 0 });
  }, [filteredSummary]);

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium">Tổng lượt tính HH</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalStats.totalReferrals}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Tổng tiền tài trợ</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatCurrency(totalStats.totalCommissionableAmount)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium">Tổng hoa hồng</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">{formatCurrency(totalStats.totalCommission)}</div></CardContent></Card>
      </div>
      <Input placeholder="Tìm kiếm theo tên người giới thiệu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      {isMobile ? (
        <div className="space-y-4">
          {filteredSummary.map((item) => (
            <Card key={item.referrer_name}>
              <CardHeader>
                <CardTitle>{item.referrer_name}</CardTitle>
                <p className="text-lg font-bold text-primary">{formatCurrency(item.total_commission)}</p>
              </CardHeader>
              <CardContent>
                <p>Lượt tính HH: {item.commissionable_referrals_count}</p>
                <p>Tổng tài trợ: {formatCurrency(item.total_commissionable_amount)}</p>
                <Button className="w-full mt-2" onClick={() => setSelectedReferrer(item.referrer_name)}>Xem chi tiết</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader><TableRow><TableHead>Người giới thiệu</TableHead><TableHead>Lượt tính HH</TableHead><TableHead>Tổng tài trợ</TableHead><TableHead>Tổng hoa hồng</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
            <TableBody>
              {filteredSummary.map((item) => (
                <TableRow key={item.referrer_name}>
                  <TableCell className="font-medium">{item.referrer_name}</TableCell>
                  <TableCell>{item.commissionable_referrals_count}</TableCell>
                  <TableCell>{formatCurrency(item.total_commissionable_amount)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedReferrer(item.referrer_name)}>Xem chi tiết</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <CommissionDetailsDialog referrerName={selectedReferrer} open={!!selectedReferrer} onOpenChange={() => setSelectedReferrer(null)} />
    </div>
  );
};

export default ReferralCommission;
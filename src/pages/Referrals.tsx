import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReferrerSummary } from "@/types/referrals";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { PageHeader } from "@/components/PageHeader";
import { ReferralDetailsDialog } from "@/components/referrals/ReferralDetailsDialog";

const ReferralsPage = () => {
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: summaryData = [], isLoading } = useQuery<ReferrerSummary[]>({
    queryKey: ['referrer_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_referrer_summary');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const filteredSummary = useMemo(() => {
    return summaryData.filter(item => 
      item.referrer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [summaryData, searchTerm]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader title="Người giới thiệu" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <PageHeader title="Người giới thiệu" />
      <Input 
        placeholder="Tìm kiếm theo tên người giới thiệu..." 
        value={searchTerm} 
        onChange={(e) => setSearchTerm(e.target.value)} 
      />
      {isMobile ? (
        <div className="space-y-4">
          {filteredSummary.map((item) => (
            <Card key={item.referrer_id}>
              <CardHeader>
                <CardTitle>{item.referrer_name}</CardTitle>
                <p className="text-lg font-bold text-primary">{formatCurrency(item.total_commission)}</p>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Số người giới thiệu: {item.referral_count}</p>
                <p>Tổng doanh thu: {formatCurrency(item.total_revenue)}</p>
                <Button className="w-full mt-2" onClick={() => setSelectedReferrer(item)}>Xem danh sách</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên người giới thiệu</TableHead>
                <TableHead>Số người giới thiệu</TableHead>
                <TableHead>Tổng doanh thu</TableHead>
                <TableHead>Hoa hồng</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSummary.map((item) => (
                <TableRow key={item.referrer_id}>
                  <TableCell className="font-medium">{item.referrer_name}</TableCell>
                  <TableCell>{item.referral_count}</TableCell>
                  <TableCell>{formatCurrency(item.total_revenue)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelectedReferrer(item)}>Xem danh sách</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <ReferralDetailsDialog referrer={selectedReferrer} open={!!selectedReferrer} onOpenChange={() => setSelectedReferrer(null)} />
    </div>
  );
};

export default ReferralsPage;
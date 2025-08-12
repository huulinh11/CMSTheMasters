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
import { cn } from "@/lib/utils";
import { ReferralFilterSheet } from "@/components/referrals/ReferralFilterSheet";

const ReferralsPage = () => {
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    role: "all",
    status: "all",
    sort: "default",
  });

  const { data: summaryData = [], isLoading } = useQuery<ReferrerSummary[]>({
    queryKey: ['referrer_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_referrer_summary');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const referrerRoles = useMemo(() => [...new Set(summaryData.map(item => item.referrer_role))], [summaryData]);

  const filteredAndSortedSummary = useMemo(() => {
    let result = summaryData
      .filter(item => 
        item.referrer_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(item => filters.role === 'all' || item.referrer_role === filters.role);

    if (filters.status !== 'all') {
      result = result.filter(item => {
        if (filters.status === 'not-achieved') return item.referral_count < item.referral_quota;
        if (filters.status === 'achieved') return item.referral_count === item.referral_quota;
        if (filters.status === 'exceeded') return item.referral_count > item.referral_quota;
        return true;
      });
    }

    if (filters.sort === 'count-asc') {
      result.sort((a, b) => a.referral_count - b.referral_count);
    } else if (filters.sort === 'count-desc') {
      result.sort((a, b) => b.referral_count - a.referral_count);
    }

    return result;
  }, [summaryData, searchTerm, filters]);

  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ role: "all", status: "all", sort: "default" });
  };

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
      <div className="flex items-center gap-2">
        <Input 
          placeholder="Tìm kiếm theo tên người giới thiệu..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <ReferralFilterSheet
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
          referrerRoles={referrerRoles}
        />
      </div>
      {isMobile ? (
        <div className="space-y-4">
          {filteredAndSortedSummary.map((item) => (
            <Card key={item.referrer_id}>
              <CardHeader>
                <CardTitle>{item.referrer_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p>Số người giới thiệu: <span className={cn(item.referral_count > item.referral_quota && "font-bold text-green-600")}>{item.referral_count}</span> / {item.referral_quota}</p>
                <p>Tổng doanh thu: {formatCurrency(item.total_revenue)}</p>
                <p>Tổng hoa hồng: <span className="font-bold text-primary">{formatCurrency(item.total_commission)}</span></p>
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
                <TableHead>Tổng hoa hồng</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedSummary.map((item) => (
                <TableRow key={item.referrer_id}>
                  <TableCell className="font-medium">{item.referrer_name}</TableCell>
                  <TableCell>
                    <span className={cn(item.referral_count > item.referral_quota && "font-bold text-green-600")}>
                      {item.referral_count}
                    </span> / {item.referral_quota}
                  </TableCell>
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
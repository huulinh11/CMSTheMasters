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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ReferralsPage = () => {
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<ReferrerSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("default");

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
      .filter(item => roleFilter === 'all' || item.referrer_role === roleFilter);

    if (statusFilter !== 'all') {
      result = result.filter(item => {
        if (statusFilter === 'not-achieved') return item.referral_count < item.referral_quota;
        if (statusFilter === 'achieved') return item.referral_count === item.referral_quota;
        if (statusFilter === 'exceeded') return item.referral_count > item.referral_quota;
        return true;
      });
    }

    if (sortOrder === 'count-asc') {
      result.sort((a, b) => a.referral_count - b.referral_count);
    } else if (sortOrder === 'count-desc') {
      result.sort((a, b) => b.referral_count - a.referral_count);
    }

    return result;
  }, [summaryData, searchTerm, roleFilter, statusFilter, sortOrder]);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger><SelectValue placeholder="Lọc theo vai trò" /></SelectTrigger>
          <SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{referrerRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Lọc theo chỉ tiêu" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chỉ tiêu</SelectItem>
            <SelectItem value="not-achieved">Chưa đạt</SelectItem>
            <SelectItem value="achieved">Đạt</SelectItem>
            <SelectItem value="exceeded">Vượt</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger><SelectValue placeholder="Sắp xếp" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Mặc định</SelectItem>
            <SelectItem value="count-asc">Số người GT (tăng dần)</SelectItem>
            <SelectItem value="count-desc">Số người GT (giảm dần)</SelectItem>
          </SelectContent>
        </Select>
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
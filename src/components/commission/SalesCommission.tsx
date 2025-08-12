import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UpsaleCommissionSummary, ServiceCommissionSummary } from "@/types/commission";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import UpsaleCommissionDetailsDialog from "@/components/Revenue/UpsaleCommissionDetailsDialog";
import { ServiceCommissionDetailsDialog } from "@/components/service-sales/ServiceCommissionDetailsDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import CommissionStats from "@/components/Revenue/CommissionStats";

type CombinedCommissionSummary = {
  userId: string;
  name: string;
  upsaleCount: number;
  totalUpsaleAmount: number;
  upsaleCommission: number;
  serviceCount: number;
  totalServicePrice: number;
  serviceCommission: number;
  totalCommission: number;
};

interface SalesCommissionProps {
  isSaleView: boolean;
  userId?: string;
}

const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-slate-500">{label}</span>
    <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
  </div>
);

const SalesCommissionCard = ({
  item,
  onViewUpsale,
  onViewService,
}: {
  item: CombinedCommissionSummary;
  onViewUpsale: (person: { userId: string; name: string; hideCommission: boolean }) => void;
  onViewService: (referrer: { id: string; name: string; hideCommission?: boolean }) => void;
}) => (
  <Card>
    <CardHeader>
      <CardTitle>{item.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      <h3 className="font-semibold text-slate-700">Upsale</h3>
      <InfoRow label="Số lượt" value={String(item.upsaleCount)} />
      <InfoRow label="Tổng tiền" value={formatCurrency(item.totalUpsaleAmount)} />
      <InfoRow label="Hoa hồng" value={formatCurrency(item.upsaleCommission)} valueClass="text-green-600 font-bold" />
      <Separator />
      <h3 className="font-semibold text-slate-700">Dịch vụ</h3>
      <InfoRow label="Số lượt" value={String(item.serviceCount)} />
      <InfoRow label="Tổng tiền" value={formatCurrency(item.totalServicePrice)} />
      <InfoRow label="Hoa hồng" value={formatCurrency(item.serviceCommission)} valueClass="text-green-600 font-bold" />
      <Separator />
      <InfoRow label="TỔNG HOA HỒNG" value={formatCurrency(item.totalCommission)} valueClass="text-xl text-primary font-bold" />
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={() => onViewUpsale({ userId: item.userId, name: item.name, hideCommission: false })} disabled={item.upsaleCount === 0}>Chi tiết Upsale</Button>
        <Button className="flex-1" variant="secondary" onClick={() => onViewService({ id: item.userId, name: item.name })} disabled={item.serviceCount === 0}>Chi tiết Dịch vụ</Button>
      </div>
    </CardContent>
  </Card>
);

const OtherSalesCard = ({ item, onViewUpsale, onViewService }: { item: CombinedCommissionSummary; onViewUpsale: (person: { userId: string; name: string; hideCommission: boolean }) => void; onViewService: (referrer: { id: string; name: string; hideCommission?: boolean }) => void; }) => (
  <Card>
    <CardHeader><CardTitle>{item.name}</CardTitle></CardHeader>
    <CardContent className="space-y-2">
      <InfoRow label="Số lượt upsale" value={String(item.upsaleCount)} />
      <InfoRow label="Tổng tiền upsale" value={formatCurrency(item.totalUpsaleAmount)} />
      <InfoRow label="Số dịch vụ" value={String(item.serviceCount)} />
      <InfoRow label="Tổng tiền dịch vụ" value={formatCurrency(item.totalServicePrice)} />
      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={() => onViewUpsale({ userId: item.userId, name: item.name, hideCommission: true })} disabled={item.upsaleCount === 0}>Chi tiết Upsale</Button>
        <Button className="flex-1" variant="secondary" onClick={() => onViewService({ id: item.userId, name: item.name, hideCommission: true })} disabled={item.serviceCount === 0}>Chi tiết Dịch vụ</Button>
      </div>
    </CardContent>
  </Card>
);

const OtherSalesTable = ({ items, onViewUpsale, onViewService }: { items: CombinedCommissionSummary[]; onViewUpsale: (person: { userId: string; name: string; hideCommission: boolean }) => void; onViewService: (referrer: { id: string; name: string; hideCommission?: boolean }) => void; }) => (
  <div className="rounded-lg border bg-white">
    <Table>
      <TableHeader><TableRow><TableHead>Tên Sale</TableHead><TableHead>Lượt Upsale</TableHead><TableHead>Tiền Upsale</TableHead><TableHead>Lượt Dịch vụ</TableHead><TableHead>Tiền Dịch vụ</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.userId}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>{item.upsaleCount}</TableCell>
            <TableCell>{formatCurrency(item.totalUpsaleAmount)}</TableCell>
            <TableCell>{item.serviceCount}</TableCell>
            <TableCell>{formatCurrency(item.totalServicePrice)}</TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => onViewUpsale({ userId: item.userId, name: item.name, hideCommission: true })} disabled={item.upsaleCount === 0}>Chi tiết Upsale</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onViewService({ id: item.userId, name: item.name, hideCommission: true })} disabled={item.serviceCount === 0}>Chi tiết Dịch vụ</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const SalesCommission = ({ isSaleView, userId }: SalesCommissionProps) => {
  const [selectedUpsalePerson, setSelectedUpsalePerson] = useState<{ userId: string; name: string; hideCommission: boolean } | null>(null);
  const [selectedServiceReferrer, setSelectedServiceReferrer] = useState<{ id: string; name: string; hideCommission?: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: upsaleSummaryData = [], isLoading: isLoadingUpsale } = useQuery<UpsaleCommissionSummary[]>({
    queryKey: ['upsale_commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('upsale_commission_summary').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: serviceSummary = [], isLoading: isLoadingService } = useQuery<ServiceCommissionSummary[]>({
    queryKey: ['service_commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_service_commission_summary');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const combinedSummary = useMemo((): CombinedCommissionSummary[] => {
    const summaryMap = new Map<string, CombinedCommissionSummary>();

    upsaleSummaryData.forEach(item => {
      summaryMap.set(item.user_id, {
        userId: item.user_id,
        name: item.upsale_person_name,
        upsaleCount: item.upsale_count,
        totalUpsaleAmount: item.total_upsale_amount,
        upsaleCommission: item.total_commission,
        serviceCount: 0,
        totalServicePrice: 0,
        serviceCommission: 0,
        totalCommission: item.total_commission,
      });
    });

    serviceSummary.forEach(item => {
      if (item.referrer_type === 'sale') {
        const existing = summaryMap.get(item.referrer_id);
        if (existing) {
          existing.serviceCount = item.service_count;
          existing.totalServicePrice = item.total_service_price;
          existing.serviceCommission = item.total_commission;
          existing.totalCommission += item.total_commission;
        } else {
          summaryMap.set(item.referrer_id, {
            userId: item.referrer_id,
            name: item.referrer_name,
            upsaleCount: 0,
            totalUpsaleAmount: 0,
            upsaleCommission: 0,
            serviceCount: item.service_count,
            totalServicePrice: item.total_service_price,
            serviceCommission: item.total_commission,
            totalCommission: item.total_commission,
          });
        }
      }
    });

    return Array.from(summaryMap.values());
  }, [upsaleSummaryData, serviceSummary]);

  const filteredSummary = useMemo(() => {
    return combinedSummary.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedSummary, searchTerm]);

  const { currentUserSummary, otherUsersSummary } = useMemo(() => {
    if (!isSaleView || !userId) {
        return { currentUserSummary: null, otherUsersSummary: filteredSummary };
    }
    const currentUser = filteredSummary.find(item => item.userId === userId);
    const others = filteredSummary.filter(item => item.userId !== userId);
    return { currentUserSummary: currentUser, otherUsersSummary: others };
  }, [filteredSummary, isSaleView, userId]);

  const totalStats = useMemo(() => {
    return filteredSummary.reduce((acc, item) => {
        acc.totalUpsaleAmount += item.totalUpsaleAmount;
        acc.totalUpsaleCount += item.upsaleCount;
        acc.totalCommission += item.totalCommission;
        return acc;
    }, { totalUpsaleAmount: 0, totalUpsaleCount: 0, totalCommission: 0 });
  }, [filteredSummary]);

  const isLoading = isLoadingUpsale || isLoadingService;
  const isMobile = useIsMobile();

  if (isLoading) return <Skeleton className="h-96 w-full rounded-lg" />;

  if (isSaleView) {
    return (
      <div className="space-y-6">
        {currentUserSummary && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Hoa hồng của bạn</h2>
            <SalesCommissionCard 
              item={currentUserSummary} 
              onViewUpsale={setSelectedUpsalePerson} 
              onViewService={setSelectedServiceReferrer} 
            />
          </div>
        )}
        {otherUsersSummary.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Thống kê Sale khác</h2>
            {isMobile ? (
              <div className="space-y-4">
                {otherUsersSummary.map((item) => (
                  <OtherSalesCard 
                    key={item.userId}
                    item={item}
                    onViewUpsale={setSelectedUpsalePerson}
                    onViewService={setSelectedServiceReferrer}
                  />
                ))}
              </div>
            ) : (
              <OtherSalesTable 
                items={otherUsersSummary}
                onViewUpsale={setSelectedUpsalePerson}
                onViewService={setSelectedServiceReferrer}
              />
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CommissionStats 
        totalUpsaleAmount={totalStats.totalUpsaleAmount}
        totalUpsaleCount={totalStats.totalUpsaleCount}
        totalCommission={totalStats.totalCommission}
      />
      <Input placeholder="Tìm kiếm theo tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSummary.map((item) => (
          <SalesCommissionCard 
            key={item.userId} 
            item={item} 
            onViewUpsale={setSelectedUpsalePerson} 
            onViewService={setSelectedServiceReferrer} 
          />
        ))}
      </div>
      <UpsaleCommissionDetailsDialog person={selectedUpsalePerson} open={!!selectedUpsalePerson} onOpenChange={() => setSelectedUpsalePerson(null)} />
      <ServiceCommissionDetailsDialog referrer={selectedServiceReferrer} open={!!selectedServiceReferrer} onOpenChange={() => setSelectedServiceReferrer(null)} />
    </div>
  );
};

export default SalesCommission;
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommissionSummary, UpsaleCommissionSummary } from "@/types/commission";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CommissionDetailsDialog from "@/components/Revenue/CommissionDetailsDialog";
import UpsaleCommissionDetailsDialog from "@/components/Revenue/UpsaleCommissionDetailsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const CommissionTab = () => {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [selectedUpsalePerson, setSelectedUpsalePerson] = useState<string | null>(null);
  
  const [commissionType, setCommissionType] = useState<'referrer' | 'upsale'>(
    profile?.role === 'Sale' ? 'upsale' : 'referrer'
  );

  const { data: referrerSummary = [], isLoading: isLoadingReferrer } = useQuery<CommissionSummary[]>({
    queryKey: ['commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_commission_summary');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: commissionType === 'referrer',
  });

  const { data: upsaleSummaryData = [], isLoading: isLoadingUpsale } = useQuery<UpsaleCommissionSummary[]>({
    queryKey: ['upsale_commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_upsale_commission_summary');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: commissionType === 'upsale',
  });

  const upsaleSummary = useMemo(() => {
    if (profile?.role === 'Sale' && upsaleSummaryData.length > 0) {
      return [...upsaleSummaryData].sort((a, b) => {
        if (a.upsale_person_name === profile.full_name) return -1;
        if (b.upsale_person_name === profile.full_name) return 1;
        return 0;
      });
    }
    return upsaleSummaryData;
  }, [upsaleSummaryData, profile]);

  const isLoading = isLoadingReferrer || isLoadingUpsale;

  const handleViewReferrerDetails = (referrerName: string) => {
    setSelectedReferrer(referrerName);
  };

  const handleViewUpsaleDetails = (personName: string) => {
    setSelectedUpsalePerson(personName);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  const renderReferrerContent = () => (
    <>
      {isMobile ? (
        <div className="space-y-4">
          {referrerSummary.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{item.referrer_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Số tiền tính hoa hồng" value={formatCurrency(item.total_commissionable_amount)} />
                <InfoRow label="Tổng hoa hồng" value={formatCurrency(item.total_commission)} valueClass="text-green-600 font-bold" />
                <Button className="w-full mt-2" onClick={() => handleViewReferrerDetails(item.referrer_name)}>
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
                <TableHead>Tên người giới thiệu</TableHead>
                <TableHead>Số tiền tính hoa hồng</TableHead>
                <TableHead>Tổng hoa hồng</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {referrerSummary.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.referrer_name}</TableCell>
                  <TableCell>{formatCurrency(item.total_commissionable_amount)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewReferrerDetails(item.referrer_name)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  const renderUpsaleContent = () => (
    <>
      {isMobile ? (
        <div className="space-y-4">
          {upsaleSummary.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{item.upsale_person_name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Số lượt upsale" value={String(item.upsale_count)} />
                <InfoRow label="Tổng tiền upsale" value={formatCurrency(item.total_upsale_amount)} />
                <InfoRow label="Tổng hoa hồng" value={formatCurrency(item.total_commission)} valueClass="text-green-600 font-bold" />
                <Button className="w-full mt-2" onClick={() => handleViewUpsaleDetails(item.upsale_person_name)}>
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
                <TableHead>Tên nhân viên</TableHead>
                <TableHead>Số lượt upsale</TableHead>
                <TableHead>Tổng tiền upsale</TableHead>
                <TableHead>Tổng hoa hồng</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upsaleSummary.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.upsale_person_name}</TableCell>
                  <TableCell>{item.upsale_count}</TableCell>
                  <TableCell>{formatCurrency(item.total_upsale_amount)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => handleViewUpsaleDetails(item.upsale_person_name)}>
                      Xem chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-4">
      {profile?.role !== 'Sale' && (
        <RadioGroup
          value={commissionType}
          onValueChange={(value) => setCommissionType(value as 'referrer' | 'upsale')}
          className="flex items-center space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="referrer" id="r1" />
            <Label htmlFor="r1">Hoa hồng giới thiệu</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="upsale" id="r2" />
            <Label htmlFor="r2">Hoa hồng Upsale</Label>
          </div>
        </RadioGroup>
      )}

      {commissionType === 'referrer' ? renderReferrerContent() : renderUpsaleContent()}

      <CommissionDetailsDialog
        referrerName={selectedReferrer}
        open={!!selectedReferrer}
        onOpenChange={(open) => !open && setSelectedReferrer(null)}
      />
      <UpsaleCommissionDetailsDialog
        upsalePersonName={selectedUpsalePerson}
        open={!!selectedUpsalePerson}
        onOpenChange={(open) => !open && setSelectedUpsalePerson(null)}
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
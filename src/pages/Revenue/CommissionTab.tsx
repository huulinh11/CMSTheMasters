import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CommissionSummary, UpsaleCommissionSummary } from "@/types/commission";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import CommissionDetailsDialog from "@/components/Revenue/CommissionDetailsDialog";
import UpsaleCommissionDetailsDialog from "@/components/Revenue/UpsaleCommissionDetailsDialog";
import { useAuth } from "@/contexts/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CommissionTab = () => {
  const { profile, user } = useAuth();
  const isMobile = useIsMobile();
  const [selectedReferrer, setSelectedReferrer] = useState<string | null>(null);
  const [selectedUpsalePerson, setSelectedUpsalePerson] = useState<{ name: string; hideCommission: boolean } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'default' | 'high-to-low' | 'low-to-high'>('default');
  
  const userRole = useMemo(() => profile?.role || user?.user_metadata?.role, [profile, user]);
  const isSale = useMemo(() => userRole === 'Sale', [userRole]);

  const [commissionType, setCommissionType] = useState<'all' | 'referrer' | 'upsale'>(
    isSale ? 'upsale' : 'all'
  );

  useEffect(() => {
    if (isSale) {
      setCommissionType('upsale');
    }
  }, [isSale]);

  const { data: referrerSummary = [], isLoading: isLoadingReferrer } = useQuery<CommissionSummary[]>({
    queryKey: ['referral_commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('referral_commission_summary').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !isSale && (commissionType === 'referrer' || commissionType === 'all'),
  });

  const { data: upsaleSummaryData = [], isLoading: isLoadingUpsale } = useQuery<UpsaleCommissionSummary[]>({
    queryKey: ['upsale_commission_summary'],
    queryFn: async () => {
      const { data, error } = await supabase.from('upsale_commission_summary').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const processedReferrerSummary = useMemo(() => {
    let data = referrerSummary.filter(item => 
      item.referrer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (sortOrder === 'high-to-low') {
      data.sort((a, b) => b.total_commission - a.total_commission);
    } else if (sortOrder === 'low-to-high') {
      data.sort((a, b) => a.total_commission - b.total_commission);
    }
    return data;
  }, [referrerSummary, searchTerm, sortOrder]);

  const processedUpsaleSummary = useMemo(() => {
    let data = upsaleSummaryData.filter(item => 
      item.upsale_person_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (sortOrder === 'high-to-low') {
      data.sort((a, b) => b.total_commission - a.total_commission);
    } else if (sortOrder === 'low-to-high') {
      data.sort((a, b) => a.total_commission - b.total_commission);
    }
    return data;
  }, [upsaleSummaryData, searchTerm, sortOrder]);

  const { currentUserSummary, otherUsersSummary } = useMemo(() => {
    if (!isSale || !profile?.full_name) {
        return { currentUserSummary: null, otherUsersSummary: processedUpsaleSummary };
    }
    const currentUserName = profile.full_name.toLowerCase().trim();
    const currentUser = processedUpsaleSummary.find(item => 
      item.upsale_person_name.toLowerCase().trim() === currentUserName
    );
    const others = processedUpsaleSummary.filter(item => 
      item.upsale_person_name.toLowerCase().trim() !== currentUserName
    );
    return { currentUserSummary: currentUser, otherUsersSummary: others };
  }, [processedUpsaleSummary, isSale, profile]);

  const isLoading = isLoadingReferrer || isLoadingUpsale;

  const handleViewReferrerDetails = (referrerName: string) => setSelectedReferrer(referrerName);
  const handleViewUpsaleDetails = (personName: string, hideCommission: boolean = false) => {
    setSelectedUpsalePerson({ name: personName, hideCommission });
  };

  const InfoRow = ({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) => (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-800 ${valueClass}`}>{value}</span>
    </div>
  );

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-lg" />;
  }

  if (isSale) {
    return (
      <div className="space-y-6">
        {currentUserSummary && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Hoa hồng của bạn</h2>
            <Card>
              <CardHeader><CardTitle>{currentUserSummary.upsale_person_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Số lượt upsale" value={String(currentUserSummary.upsale_count)} />
                <InfoRow label="Tổng tiền upsale" value={formatCurrency(currentUserSummary.total_upsale_amount)} />
                <InfoRow label="Tổng hoa hồng" value={formatCurrency(currentUserSummary.total_commission)} valueClass="text-green-600 font-bold" />
                <Button className="w-full mt-2" onClick={() => handleViewUpsaleDetails(currentUserSummary.upsale_person_name, false)}>Xem chi tiết</Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {otherUsersSummary.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Danh sách saler khác</h2>
            {isMobile ? (
              <div className="space-y-4">
                {otherUsersSummary.map((item, index) => (
                  <Card key={index}>
                    <CardHeader><CardTitle>{item.upsale_person_name}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <InfoRow label="Số lượt upsale" value={String(item.upsale_count)} />
                      <InfoRow label="Tổng tiền upsale" value={formatCurrency(item.total_upsale_amount)} />
                      <Button className="w-full mt-2" onClick={() => handleViewUpsaleDetails(item.upsale_person_name, true)}>Xem chi tiết</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border bg-white">
                <Table>
                  <TableHeader><TableRow><TableHead>STT</TableHead><TableHead>Tên nhân viên</TableHead><TableHead>Số lượt upsale</TableHead><TableHead>Tổng tiền upsale</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {otherUsersSummary.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{item.upsale_person_name}</TableCell>
                        <TableCell>{item.upsale_count}</TableCell>
                        <TableCell>{formatCurrency(item.total_upsale_amount)}</TableCell>
                        <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewUpsaleDetails(item.upsale_person_name, true)}>Xem chi tiết</Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}
        
        <UpsaleCommissionDetailsDialog 
          upsalePersonName={selectedUpsalePerson?.name || null} 
          open={!!selectedUpsalePerson} 
          onOpenChange={() => setSelectedUpsalePerson(null)}
          hideCommission={selectedUpsalePerson?.hideCommission}
        />
      </div>
    );
  }

  const renderReferrerContent = () => (
    <>
      {isMobile ? (
        <div className="space-y-4">
          {processedReferrerSummary.map((item, index) => (
            <Card key={index}>
              <CardHeader><CardTitle>{item.referrer_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Số tiền tính hoa hồng" value={formatCurrency(item.total_commissionable_amount)} />
                <InfoRow label="Tổng hoa hồng" value={formatCurrency(item.total_commission)} valueClass="text-green-600 font-bold" />
                <Button className="w-full mt-2" onClick={() => handleViewReferrerDetails(item.referrer_name)}>Xem chi tiết</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader><TableRow><TableHead className="w-[50px]">STT</TableHead><TableHead>Tên người giới thiệu</TableHead><TableHead>Số tiền tính hoa hồng</TableHead><TableHead>Tổng hoa hồng</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
            <TableBody>
              {processedReferrerSummary.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.referrer_name}</TableCell>
                  <TableCell>{formatCurrency(item.total_commissionable_amount)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewReferrerDetails(item.referrer_name)}>Xem chi tiết</Button></TableCell>
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
          {processedUpsaleSummary.map((item, index) => (
            <Card key={index}>
              <CardHeader><CardTitle>{item.upsale_person_name}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <InfoRow label="Số lượt upsale" value={String(item.upsale_count)} />
                <InfoRow label="Tổng tiền upsale" value={formatCurrency(item.total_upsale_amount)} />
                <InfoRow label="Tổng hoa hồng" value={formatCurrency(item.total_commission)} valueClass="text-green-600 font-bold" />
                <Button className="w-full mt-2" onClick={() => handleViewUpsaleDetails(item.upsale_person_name)}>Xem chi tiết</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader><TableRow><TableHead className="w-[50px]">STT</TableHead><TableHead>Tên nhân viên</TableHead><TableHead>Số lượt upsale</TableHead><TableHead>Tổng tiền upsale</TableHead><TableHead>Tổng hoa hồng</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
            <TableBody>
              {processedUpsaleSummary.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell className="font-medium">{item.upsale_person_name}</TableCell>
                  <TableCell>{item.upsale_count}</TableCell>
                  <TableCell>{formatCurrency(item.total_upsale_amount)}</TableCell>
                  <TableCell className="font-semibold text-green-600">{formatCurrency(item.total_commission)}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => handleViewUpsaleDetails(item.upsale_person_name)}>Xem chi tiết</Button></TableCell>
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
      {!isSale && (
        <div className="flex flex-col md:flex-row gap-2">
          <Input 
            placeholder="Tìm kiếm theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Sắp xếp theo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Mặc định</SelectItem>
                <SelectItem value="high-to-low">Hoa hồng: Cao đến thấp</SelectItem>
                <SelectItem value="low-to-high">Hoa hồng: Thấp đến cao</SelectItem>
              </SelectContent>
            </Select>
            <Select value={commissionType} onValueChange={(value) => setCommissionType(value as any)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Loại hoa hồng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="referrer">Giới thiệu</SelectItem>
                <SelectItem value="upsale">Upsale</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      { (commissionType === 'all' || commissionType === 'upsale') && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Hoa hồng Upsale</h2>
          {renderUpsaleContent()}
        </div>
      )}
      
      { !isSale && (commissionType === 'all' || commissionType === 'referrer') && (
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Hoa hồng giới thiệu</h2>
          {renderReferrerContent()}
        </div>
      )}

      <CommissionDetailsDialog referrerName={selectedReferrer} open={!!selectedReferrer} onOpenChange={(open) => !open && setSelectedReferrer(null)} />
      <UpsaleCommissionDetailsDialog 
        upsalePersonName={selectedUpsalePerson?.name || null} 
        open={!!selectedUpsalePerson} 
        onOpenChange={() => setSelectedUpsalePerson(null)}
        hideCommission={selectedUpsalePerson?.hideCommission}
      />
    </div>
  );
};

export default CommissionTab;
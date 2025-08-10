import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Settings } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ChecklistSettings from "@/pages/ChecklistSettings";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

const ChecklistTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useIsMobile();

  const { data: vipGuests = [], isLoading: isLoadingVip } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: regularGuests = [], isLoading: isLoadingRegular } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const allGuests = useMemo((): CombinedGuest[] => {
    const combined = [
      ...vipGuests.map(g => ({ ...g, type: 'Chức vụ' as const })),
      ...regularGuests.map(g => ({ ...g, type: 'Khách mời' as const }))
    ];
    return combined;
  }, [vipGuests, regularGuests]);

  const filteredGuests = useMemo(() => {
    return allGuests.filter(guest => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        guest.name.toLowerCase().includes(searchTermLower) ||
        guest.role.toLowerCase().includes(searchTermLower) ||
        (guest.phone && guest.phone.includes(searchTerm))
      );
    });
  }, [allGuests, searchTerm]);

  const handleCopyLink = (type: 'id' | 'phone', value: string) => {
    if (!value) {
      showError(`Khách mời này không có ${type === 'id' ? 'ID' : 'SĐT'}.`);
      return;
    }
    const url = `${window.location.origin}/checklist/${value}`;
    navigator.clipboard.writeText(url);
    showSuccess(`Đã sao chép link checklist theo ${type === 'id' ? 'ID' : 'SĐT'}!`);
  };

  const isLoading = isLoadingVip || isLoadingRegular;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <Input
          placeholder="Tìm kiếm khách mời theo tên, vai trò, SĐT..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="flex-shrink-0">
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
            <SheetHeader className="p-4 border-b flex-shrink-0">
              <SheetTitle>Cấu hình Checklist</SheetTitle>
            </SheetHeader>
            <div className="p-4 overflow-y-auto flex-grow">
              <ChecklistSettings />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <div className="space-y-4">
          {filteredGuests.map(guest => (
            <Card key={guest.id}>
              <CardHeader className="pb-2">
                <CardTitle>{guest.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{guest.role}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm">SĐT: {guest.phone || 'N/A'}</p>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1" variant="outline" onClick={() => handleCopyLink('id', guest.id)}>
                    <Copy className="mr-2 h-4 w-4" /> Link ID
                  </Button>
                  <Button className="flex-1" onClick={() => handleCopyLink('phone', guest.phone)} disabled={!guest.phone}>
                    <Copy className="mr-2 h-4 w-4" /> Link SĐT
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>SĐT</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead className="text-right">Link Checklist</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGuests.length > 0 ? (
                filteredGuests.map(guest => (
                  <TableRow key={guest.id}>
                    <TableCell className="font-medium">{guest.name}</TableCell>
                    <TableCell>{guest.phone || 'N/A'}</TableCell>
                    <TableCell>{guest.role}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink('id', guest.id)}>
                          <Copy className="mr-2 h-4 w-4" /> ID
                        </Button>
                        <Button variant="default" size="sm" onClick={() => handleCopyLink('phone', guest.phone)} disabled={!guest.phone}>
                          <Copy className="mr-2 h-4 w-4" /> SĐT
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Không tìm thấy khách mời.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ChecklistTab;
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    return allGuests.filter(guest => 
      (guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.phone.includes(searchTerm)) && guest.phone
    );
  }, [allGuests, searchTerm]);

  const handleCopyLink = (phone: string) => {
    const url = `${window.location.origin}/checklist/${phone}`;
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép link checklist!");
  };

  const isLoading = isLoadingVip || isLoadingRegular;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm khách mời theo tên, vai trò, SĐT..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
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
                <p className="text-sm">SĐT: {guest.phone}</p>
                <Button className="w-full mt-4" onClick={() => handleCopyLink(guest.phone)}>
                  <Copy className="mr-2 h-4 w-4" /> Sao chép link
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
                    <TableCell>{guest.phone}</TableCell>
                    <TableCell>{guest.role}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleCopyLink(guest.phone)}>
                        <Copy className="mr-2 h-4 w-4" /> Sao chép
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Không tìm thấy khách mời có SĐT.
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
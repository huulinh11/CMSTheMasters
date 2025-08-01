import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Edit } from "lucide-react";
import { showSuccess } from "@/utils/toast";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

const ProfileManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");

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
    return combined.filter(g => g.role !== 'Super Vip');
  }, [vipGuests, regularGuests]);

  const filteredGuests = useMemo(() => {
    return allGuests.filter(guest => 
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allGuests, searchTerm]);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/profile/${slug}`;
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép link!");
  };

  const isLoading = isLoadingVip || isLoadingRegular;

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm khách mời..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead>Link Public</TableHead>
              <TableHead className="text-right">Tác vụ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGuests.length > 0 ? (
              filteredGuests.map(guest => (
                <TableRow key={guest.id}>
                  <TableCell className="font-medium">{guest.name}</TableCell>
                  <TableCell>{guest.role}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {guest.slug ? `/profile/${guest.slug}` : "Chưa có"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {guest.slug && (
                      <Button variant="outline" size="sm" onClick={() => handleCopyLink(guest.slug!)}>
                        <Copy className="mr-2 h-4 w-4" /> Sao chép
                      </Button>
                    )}
                    <Button variant="default" size="sm" disabled>
                      <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                    </Button>
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
    </div>
  );
};

export default ProfileManagementTab;
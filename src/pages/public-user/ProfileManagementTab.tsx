import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Copy, Edit } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileManagementCards } from "@/components/public-user/ProfileManagementCards";
import { generateGuestSlug } from "@/lib/slug";
import { EditProfileDialog } from "@/components/public-user/EditProfileDialog";
import { ContentBlock } from "@/types/profile-content";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

const ProfileManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingGuest, setEditingGuest] = useState<CombinedGuest | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

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

  const backfillSlugsMutation = useMutation({
    mutationFn: async ({ vipUpdates, regularUpdates }: { vipUpdates: { id: string, slug: string }[], regularUpdates: { id: string, slug: string }[] }) => {
      const promises = [];
      if (vipUpdates.length > 0) {
        for (const update of vipUpdates) {
          promises.push(supabase.from('vip_guests').update({ slug: update.slug }).eq('id', update.id));
        }
      }
      if (regularUpdates.length > 0) {
        for (const update of regularUpdates) {
          promises.push(supabase.from('guests').update({ slug: update.slug }).eq('id', update.id));
        }
      }
      
      const results = await Promise.all(promises);
      const firstError = results.find(res => res.error);
      if (firstError) {
        throw new Error(firstError.error!.message);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showSuccess("Đã tạo link public cho các khách mời!");
    },
    onError: (error: Error) => {
      showError(`Lỗi cập nhật link public: ${error.message}`);
    }
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async ({ guest, content }: { guest: CombinedGuest, content: ContentBlock[] }) => {
      const tableName = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
      const { error } = await supabase
        .from(tableName)
        .update({ profile_content: content })
        .eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      queryClient.invalidateQueries({ queryKey: ['public_profile'] });
      showSuccess("Cập nhật profile thành công!");
      setEditingGuest(null);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    }
  });

  useEffect(() => {
    if (!isLoadingVip && !isLoadingRegular && !backfillSlugsMutation.isPending) {
      const vipGuestsToUpdate = vipGuests
        .filter(g => !g.slug)
        .map(g => ({ id: g.id, slug: generateGuestSlug(g.name) }));

      const regularGuestsToUpdate = regularGuests
        .filter(g => !g.slug)
        .map(g => ({ id: g.id, slug: generateGuestSlug(g.name) }));

      if (vipGuestsToUpdate.length > 0 || regularGuestsToUpdate.length > 0) {
        backfillSlugsMutation.mutate({ vipUpdates: vipGuestsToUpdate, regularUpdates: regularGuestsToUpdate });
      }
    }
  }, [vipGuests, regularGuests, isLoadingVip, isLoadingRegular, backfillSlugsMutation]);

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

  const handleEditProfile = (guest: CombinedGuest) => {
    setEditingGuest(guest);
  };

  const handleSaveProfile = (content: ContentBlock[]) => {
    if (!editingGuest) return;
    profileUpdateMutation.mutate({ guest: editingGuest, content });
  };

  const isLoading = isLoadingVip || isLoadingRegular;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm khách mời..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />
      {isLoading || backfillSlugsMutation.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <ProfileManagementCards 
          guests={filteredGuests}
          onCopyLink={handleCopyLink}
          onEdit={handleEditProfile}
        />
      ) : (
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
                      {guest.slug ? `/profile/${guest.slug}` : "Đang tạo..."}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {guest.slug && (
                        <Button variant="outline" size="sm" onClick={() => handleCopyLink(guest.slug!)}>
                          <Copy className="mr-2 h-4 w-4" /> Sao chép
                        </Button>
                      )}
                      <Button variant="default" size="sm" onClick={() => handleEditProfile(guest)}>
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
      )}
      <EditProfileDialog
        open={!!editingGuest}
        onOpenChange={(isOpen) => !isOpen && setEditingGuest(null)}
        guest={editingGuest}
        onSave={handleSaveProfile}
        isSaving={profileUpdateMutation.isPending}
      />
    </div>
  );
};

export default ProfileManagementTab;
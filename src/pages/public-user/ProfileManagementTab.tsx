import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest, ProfileStatus } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Eye } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileManagementCards } from "@/components/public-user/ProfileManagementCards";
import { ProfileManagementTable } from "@/components/public-user/ProfileManagementTable";
import { generateGuestSlug } from "@/lib/slug";
import { EditProfileDialog } from "@/components/public-user/EditProfileDialog";
import { ContentBlock } from "@/types/profile-content";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleConfiguration } from "@/types/role-configuration";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời', profile_status?: ProfileStatus };

const ProfileManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
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

  const { data: roleConfigs = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
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
      const updatePayload: { profile_content: ContentBlock[], profile_status?: ProfileStatus } = {
        profile_content: content,
      };
      if (guest.profile_status === 'Trống') {
        updatePayload.profile_status = 'Đang chỉnh sửa';
      }
      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
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

  const statusUpdateMutation = useMutation({
    mutationFn: async ({ guest, newStatus }: { guest: CombinedGuest, newStatus: ProfileStatus }) => {
      const tableName = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
      const { error } = await supabase.from(tableName).update({ profile_status: newStatus }).eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showSuccess("Cập nhật trạng thái thành công!");
    },
    onError: (error: Error) => showError(error.message),
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

  const getEffectiveStatus = (guest: CombinedGuest): ProfileStatus => {
    if (guest.profile_status === 'Hoàn tất') {
      return 'Hoàn tất';
    }
    if (!guest.profile_content || (Array.isArray(guest.profile_content) && guest.profile_content.length === 0)) {
      return 'Trống';
    }
    return 'Đang chỉnh sửa';
  };

  const filteredGuests = useMemo(() => {
    return allGuests.filter(guest => {
      const searchMatch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const effectiveStatus = getEffectiveStatus(guest);
      const statusMatch = statusFilter === 'all' || effectiveStatus === statusFilter;
      const typeMatch = typeFilter === 'all' || guest.type === typeFilter;
      const roleMatch = roleFilter === 'all' || guest.role === roleFilter;

      return searchMatch && statusMatch && typeMatch && roleMatch;
    });
  }, [allGuests, searchTerm, statusFilter, typeFilter, roleFilter]);

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/profile/${slug}`;
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép link!");
  };

  const handleEditProfile = (guest: CombinedGuest) => {
    setEditingGuest(guest);
  };

  const handleViewDetails = (guest: CombinedGuest) => {
    if (guest.slug) {
      window.open(`/profile/${guest.slug}`, '_blank');
    } else {
      showError("Khách mời này chưa có link public.");
    }
  };

  const handleSaveProfile = (content: ContentBlock[]) => {
    if (!editingGuest) return;
    profileUpdateMutation.mutate({ guest: editingGuest, content });
  };

  const handleStatusChange = (guest: CombinedGuest, isCompleted: boolean) => {
    let newStatus: ProfileStatus;
    if (isCompleted) {
      newStatus = 'Hoàn tất';
    } else {
      if (!guest.profile_content || (Array.isArray(guest.profile_content) && guest.profile_content.length === 0)) {
        newStatus = 'Trống';
      } else {
        newStatus = 'Đang chỉnh sửa';
      }
    }
    statusUpdateMutation.mutate({ guest, newStatus });
  };

  const isLoading = isLoadingVip || isLoadingRegular || isLoadingRoles;

  const allRoleOptions = useMemo(() => {
    return [...new Set(roleConfigs.map(r => r.name))].sort();
  }, [roleConfigs]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          placeholder="Tìm kiếm khách mời..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Lọc loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại</SelectItem>
            <SelectItem value="Chức vụ">Chức vụ</SelectItem>
            <SelectItem value="Khách mời">Khách mời</SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Lọc vai trò" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả vai trò</SelectItem>
            {allRoleOptions.map(role => (
              <SelectItem key={role} value={role}>{role}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Lọc trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {['Trống', 'Đang chỉnh sửa', 'Hoàn tất'].map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <h2 className="text-xl font-bold text-slate-800">Tổng: {filteredGuests.length}</h2>
      {isLoading || backfillSlugsMutation.isPending ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <ProfileManagementCards 
          guests={filteredGuests.map(g => ({ ...g, effectiveStatus: getEffectiveStatus(g) }))}
          onCopyLink={handleCopyLink}
          onEdit={handleEditProfile}
          onView={handleViewDetails}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <ProfileManagementTable
          guests={filteredGuests.map(g => ({ ...g, effectiveStatus: getEffectiveStatus(g) }))}
          onCopyLink={handleCopyLink}
          onEdit={handleEditProfile}
          onView={handleViewDetails}
          onStatusChange={handleStatusChange}
        />
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
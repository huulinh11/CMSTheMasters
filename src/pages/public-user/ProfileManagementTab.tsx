import { useMemo, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VipGuest, ProfileStatus } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Edit, Eye, Layers } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProfileManagementCards } from "@/components/public-user/ProfileManagementCards";
import { ProfileManagementTable } from "@/components/public-user/ProfileManagementTable";
import { generateGuestSlug } from "@/lib/slug";
import { EditProfileDialog } from "@/components/public-user/EditProfileDialog";
import { ContentBlock } from "@/types/profile-content";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RoleConfiguration } from "@/types/role-configuration";
import { ProfileTemplate } from "@/types/profile-template";
import { TemplateManagementDialog } from "@/components/public-user/TemplateManagementDialog";
import { EditTemplateDialog } from "@/components/public-user/EditTemplateDialog";
import { AssignTemplateDialog } from "@/components/public-user/AssignTemplateDialog";
import { DuplicateTemplateDialog } from "@/components/public-user/DuplicateTemplateDialog";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời', profile_status?: ProfileStatus };

const ProfileManagementTab = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingGuest, setEditingGuest] = useState<CombinedGuest | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [isEditTemplateOpen, setIsEditTemplateOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<ProfileTemplate> | null>(null);
  const [isAssignTemplateOpen, setIsAssignTemplateOpen] = useState(false);
  const [duplicatingTemplate, setDuplicatingTemplate] = useState<ProfileTemplate | null>(null);
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: vipGuests = [], isLoading: isLoadingVip } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: regularGuests = [], isLoading: isLoadingRegular } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
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

  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery<ProfileTemplate[]>({
    queryKey: ['profile_templates'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profile_templates').select('*').order('name');
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
      const updatePayload: { profile_content: ContentBlock[], profile_status?: ProfileStatus, template_id?: string | null } = {
        profile_content: content,
        template_id: null, // Unlink from template on manual edit
      };
      if (guest.profile_status === 'Trống' || !guest.profile_status) {
        updatePayload.profile_status = 'Đang chỉnh sửa';
      }
      
      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
        .eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: (data, variables) => {
      const { guest } = variables;
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      if (guest.slug) {
        queryClient.invalidateQueries({ queryKey: ['public_profile', guest.slug] });
      }
      const guestType = guest.type === 'Chức vụ' ? 'vip' : 'regular';
      queryClient.invalidateQueries({ queryKey: ['guest_details', guestType, guest.id] });

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

  const templateMutation = useMutation({
    mutationFn: async (template: Partial<ProfileTemplate>) => {
      const { error } = await supabase.from('profile_templates').upsert(template);
      if (error) throw error;
      
      if (template.assigned_roles && template.id) {
        for (const role of template.assigned_roles) {
          const { error: rpcError } = await supabase.rpc('apply_template_to_role', {
            target_role: role,
            target_template_id: template.id,
          });
          if (rpcError) throw rpcError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile_templates'] });
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showSuccess("Lưu template thành công!");
      setIsEditTemplateOpen(false);
      setEditingTemplate(null);
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase.from('profile_templates').delete().eq('id', templateId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile_templates'] });
      showSuccess("Xóa template thành công!");
    },
    onError: (error: Error) => showError(error.message),
  });

  const assignTemplateMutation = useMutation({
    mutationFn: async ({ templateId, guestIds }: { templateId: string, guestIds: string[] }) => {
      const promises = guestIds.map(guestId => 
        supabase.rpc('apply_template_to_guest', {
          target_guest_id: guestId,
          target_template_id: templateId,
        })
      );
      const results = await Promise.all(promises);
      const firstError = results.find(res => res.error);
      if (firstError) throw firstError.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showSuccess("Gán template thành công!");
      setIsAssignTemplateOpen(false);
    },
    onError: (error: Error) => showError(error.message),
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async ({ name, roles, content }: { name: string; roles: string[]; content: ContentBlock[] | null }) => {
      const { error } = await supabase.from('profile_templates').insert({
        name,
        assigned_roles: roles,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile_templates'] });
      showSuccess("Nhân bản template thành công!");
      setDuplicatingTemplate(null);
    },
    onError: (error: Error) => {
      showError(`Lỗi nhân bản: ${error.message}`);
    },
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

  const guestsWithTemplateInfo = useMemo(() => {
    return allGuests.map(guest => {
      const template = templates.find(t => t.id === guest.template_id);
      return { ...guest, templateName: template?.name };
    });
  }, [allGuests, templates]);

  const filteredGuests = useMemo(() => {
    return guestsWithTemplateInfo.filter(guest => {
      const searchMatch = 
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.role.toLowerCase().includes(searchTerm.toLowerCase());
      
      const effectiveStatus = getEffectiveStatus(guest);
      const statusMatch = statusFilter === 'all' || effectiveStatus === statusFilter;
      const typeMatch = typeFilter === 'all' || guest.type === typeFilter;
      const roleMatch = roleFilter === 'all' || guest.role === roleFilter;

      return searchMatch && statusMatch && typeMatch && roleMatch;
    });
  }, [guestsWithTemplateInfo, searchTerm, statusFilter, typeFilter, roleFilter]);

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

  const handleSaveProfile = ({ content }: { content: ContentBlock[] }) => {
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

  const isLoading = isLoadingVip || isLoadingRegular || isLoadingRoles || isLoadingTemplates;

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
        <div className="grid grid-cols-2 md:flex md:items-center gap-2 w-full md:w-auto">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-auto"><SelectValue placeholder="Lọc loại" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tất cả loại</SelectItem><SelectItem value="Chức vụ">Chức vụ</SelectItem><SelectItem value="Khách mời">Khách mời</SelectItem></SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-auto"><SelectValue placeholder="Lọc vai trò" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tất cả vai trò</SelectItem>{allRoleOptions.map(role => (<SelectItem key={role} value={role}>{role}</SelectItem>))}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-auto"><SelectValue placeholder="Lọc trạng thái" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Tất cả trạng thái</SelectItem>{['Trống', 'Đang chỉnh sửa', 'Hoàn tất'].map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsTemplateManagerOpen(true)} className="w-full md:w-auto">
            <Layers className="mr-2 h-4 w-4" /> Templates
          </Button>
        </div>
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
      <TemplateManagementDialog
        open={isTemplateManagerOpen}
        onOpenChange={setIsTemplateManagerOpen}
        templates={templates}
        onAdd={() => { setEditingTemplate(null); setIsEditTemplateOpen(true); }}
        onEdit={(template) => { setEditingTemplate(template); setIsEditTemplateOpen(true); }}
        onDelete={(id) => deleteTemplateMutation.mutate(id)}
        onAssign={() => { setIsTemplateManagerOpen(false); setIsAssignTemplateOpen(true); }}
        onDuplicate={(template) => setDuplicatingTemplate(template)}
      />
      <EditTemplateDialog
        open={isEditTemplateOpen}
        onOpenChange={setIsEditTemplateOpen}
        template={editingTemplate}
        onSave={(template) => templateMutation.mutate(template)}
        isSaving={templateMutation.isPending}
        allRoles={roleConfigs}
        templates={templates}
      />
      <AssignTemplateDialog
        open={isAssignTemplateOpen}
        onOpenChange={setIsAssignTemplateOpen}
        templates={templates}
        guests={allGuests}
        onAssign={(templateId, guestIds) => assignTemplateMutation.mutate({ templateId, guestIds })}
        isAssigning={assignTemplateMutation.isPending}
      />
      <DuplicateTemplateDialog
        open={!!duplicatingTemplate}
        onOpenChange={() => setDuplicatingTemplate(null)}
        template={duplicatingTemplate}
        onDuplicate={({ name, roles }) => {
          if (duplicatingTemplate) {
            duplicateTemplateMutation.mutate({
              name,
              roles,
              content: duplicatingTemplate.content,
            });
          }
        }}
        isDuplicating={duplicateTemplateMutation.isPending}
        allRoles={roleConfigs}
      />
    </div>
  );
};

export default ProfileManagementTab;
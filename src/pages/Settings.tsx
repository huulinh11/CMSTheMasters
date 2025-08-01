import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RoleConfiguration, RoleConfigFormValues } from "@/types/role-configuration";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { AddEditRoleDialog } from "../components/settings/AddEditRoleDialog";
import { RoleConfigTable } from "../components/settings/RoleConfigTable";
import { RoleConfigCards } from "../components/settings/RoleConfigCards";

const Settings = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleConfiguration | null>(null);

  const { data: roles = [], isLoading } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const addOrEditMutation = useMutation({
    mutationFn: async (values: RoleConfigFormValues) => {
      const { error } = await supabase.from('role_configurations').upsert(
        editingRole ? { id: editingRole.id, ...values } : values
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_configurations'] });
      showSuccess(editingRole ? "Cập nhật vai trò thành công!" : "Thêm vai trò thành công!");
      setIsDialogOpen(false);
      setEditingRole(null);
    },
    onError: (error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('role_configurations').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role_configurations'] });
      showSuccess("Đã xóa vai trò.");
    },
    onError: (error) => showError(error.message),
  });

  const handleOpenAddDialog = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (role: RoleConfiguration) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Cấu hình vai trò</h1>
        <Button onClick={handleOpenAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm vai trò
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : isMobile ? (
        <RoleConfigCards roles={roles} onEdit={handleOpenEditDialog} onDelete={deleteMutation.mutate} />
      ) : (
        <RoleConfigTable roles={roles} onEdit={handleOpenEditDialog} onDelete={deleteMutation.mutate} />
      )}

      <AddEditRoleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSubmit={addOrEditMutation.mutate}
        defaultValues={editingRole}
      />
    </div>
  );
};

export default Settings;
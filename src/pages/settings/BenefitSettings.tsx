import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleConfiguration } from "@/types/role-configuration";
import { AddEditBenefitDialog } from "@/components/settings/AddEditBenefitDialog";
import { Badge } from "@/components/ui/badge";

interface BenefitItem {
  id: string;
  name: string;
}

interface RoleBenefit {
  role_name: string;
  benefit_name: string;
}

const BenefitSettings = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ name: string; roles: string[] } | null>(null);

  const { data: benefits = [], isLoading: isLoadingBenefits } = useQuery<BenefitItem[]>({
    queryKey: ['media_benefits_master'],
    queryFn: async () => {
      const { data, error } = await supabase.from('media_benefits_master').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: roleBenefits = [], isLoading: isLoadingRoleBenefits } = useQuery<RoleBenefit[]>({
    queryKey: ['role_benefits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_benefits').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const benefitsWithRoles = useMemo(() => {
    const roleBenefitsMap = new Map<string, string[]>();
    roleBenefits.forEach(rb => {
      if (!roleBenefitsMap.has(rb.benefit_name)) {
        roleBenefitsMap.set(rb.benefit_name, []);
      }
      roleBenefitsMap.get(rb.benefit_name)!.push(rb.role_name);
    });
    return benefits.map(benefit => ({
      ...benefit,
      roles: roleBenefitsMap.get(benefit.name) || [],
    }));
  }, [benefits, roleBenefits]);

  const mutation = useMutation({
    mutationFn: async ({ name, roles, originalName }: { name: string; roles: string[]; originalName?: string }) => {
      const isEditing = !!originalName;

      // Step 1: Handle the master benefit table.
      if (isEditing) {
        if (name !== originalName) {
          const { error: updateError } = await supabase
            .from('media_benefits_master')
            .update({ name })
            .eq('name', originalName);
          if (updateError) throw updateError;
        }
      } else {
        const { error: insertError } = await supabase
          .from('media_benefits_master')
          .insert({ name });
        if (insertError) throw insertError;
      }

      // Step 2: Sync the role associations.
      const { error: deleteError } = await supabase
        .from('role_benefits')
        .delete()
        .eq('benefit_name', name);
      if (deleteError) throw deleteError;

      if (roles.length > 0) {
        const newLinks = roles.map(role_name => ({ benefit_name: name, role_name }));
        const { error: insertLinksError } = await supabase
          .from('role_benefits')
          .insert(newLinks);
        if (insertLinksError) throw insertLinksError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media_benefits_master'] });
      queryClient.invalidateQueries({ queryKey: ['role_benefits'] });
      showSuccess(`Quyền lợi đã được ${editingItem ? 'cập nhật' : 'thêm'} thành công!`);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('media_benefits_master').delete().eq('name', name);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media_benefits_master'] });
      queryClient.invalidateQueries({ queryKey: ['role_benefits'] });
      showSuccess(`Đã xóa quyền lợi.`);
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleOpenDialog = (item: { name: string; roles: string[] } | null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const isLoading = isLoadingBenefits || isLoadingRoles || isLoadingRoleBenefits;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Danh sách Quyền lợi truyền thông</h2>
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Quyền lợi
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Quyền lợi</TableHead>
                <TableHead>Áp dụng cho vai trò</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {benefitsWithRoles.length > 0 ? (
                benefitsWithRoles.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.roles.map(role => <Badge key={role} variant="secondary">{role}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(item.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Chưa có quyền lợi nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEditBenefitDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={mutation.mutate}
        isSaving={mutation.isPending}
        item={editingItem}
        allRoles={roles}
      />
    </div>
  );
};

export default BenefitSettings;
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { USER_ROLES } from "@/types/app-user";
import { allNavItems } from "@/config/nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";

type RolePermissions = {
  role: string;
  permissions: string[];
};

const PermissionSettings = () => {
  const queryClient = useQueryClient();

  const { data: permissionsData = [], isLoading } = useQuery<RolePermissions[]>({
    queryKey: ['role_permissions'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_permissions').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (updatedPermission: RolePermissions) => {
      const { error } = await supabase.from('role_permissions').upsert(updatedPermission, { onConflict: 'role' });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role_permissions'] });
      showSuccess(`Đã cập nhật quyền cho vai trò ${variables.role}!`);
    },
    onError: (error: Error) => showError(error.message),
  });

  const handlePermissionChange = (role: string, permissionId: string, isChecked: boolean) => {
    const currentPermissions = permissionsData.find(p => p.role === role)?.permissions || [];
    const newPermissions = isChecked
      ? [...currentPermissions, permissionId]
      : currentPermissions.filter(p => p !== permissionId);
    
    mutation.mutate({ role, permissions: newPermissions });
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {USER_ROLES.map(role => {
        const currentPermissions = permissionsData.find(p => p.role === role)?.permissions || [];
        return (
          <Card key={role}>
            <CardHeader>
              <CardTitle>{role}</CardTitle>
              <CardDescription>Chọn các trang và tính năng mà vai trò này có thể truy cập.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allNavItems.map(navItem => (
                <div key={navItem.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${role}-${navItem.id}`}
                    checked={currentPermissions.includes(navItem.id)}
                    onCheckedChange={(checked) => handlePermissionChange(role, navItem.id, !!checked)}
                  />
                  <Label htmlFor={`${role}-${navItem.id}`} className="font-normal">
                    {navItem.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PermissionSettings;
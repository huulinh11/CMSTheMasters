import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RoleConfiguration } from "@/types/role-configuration";
import { AddEditTaskDialog } from "@/components/settings/AddEditTaskDialog";
import { Badge } from "@/components/ui/badge";

interface TaskItem {
  id: string;
  name: string;
}

interface RoleTask {
  role_name: string;
  task_name: string;
}

const TaskSettings = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{ name: string; roles: string[] } | null>(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<TaskItem[]>({
    queryKey: ['event_tasks_master'],
    queryFn: async () => {
      const { data, error } = await supabase.from('event_tasks_master').select('*').order('name', { ascending: true });
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

  const { data: roleTasks = [], isLoading: isLoadingRoleTasks } = useQuery<RoleTask[]>({
    queryKey: ['role_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_tasks').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const tasksWithRoles = useMemo(() => {
    const roleTasksMap = new Map<string, string[]>();
    roleTasks.forEach(rt => {
      if (!roleTasksMap.has(rt.task_name)) {
        roleTasksMap.set(rt.task_name, []);
      }
      roleTasksMap.get(rt.task_name)!.push(rt.role_name);
    });
    return tasks.map(task => ({
      ...task,
      roles: roleTasksMap.get(task.name) || [],
    }));
  }, [tasks, roleTasks]);

  const mutation = useMutation({
    mutationFn: async ({ name, roles, originalName }: { name: string; roles: string[]; originalName?: string }) => {
      const isEditing = !!originalName;

      // Step 1: Handle the master task table.
      if (isEditing) {
        // If the name has changed, update it. The CASCADE will handle role_tasks.
        if (name !== originalName) {
          const { error: updateError } = await supabase
            .from('event_tasks_master')
            .update({ name })
            .eq('name', originalName);
          if (updateError) throw updateError;
        }
      } else {
        // If it's a new task, insert it.
        const { error: insertError } = await supabase
          .from('event_tasks_master')
          .insert({ name });
        if (insertError) throw insertError;
      }

      // Step 2: Sync the role associations.
      // First, delete all existing associations for this task.
      // We use the *new* name because if it was updated, the CASCADE took care of it.
      const { error: deleteError } = await supabase
        .from('role_tasks')
        .delete()
        .eq('task_name', name);
      if (deleteError) throw deleteError;

      // Second, if there are any roles to associate, insert them.
      if (roles.length > 0) {
        const newLinks = roles.map(role_name => ({ task_name: name, role_name }));
        const { error: insertLinksError } = await supabase
          .from('role_tasks')
          .insert(newLinks);
        if (insertLinksError) throw insertLinksError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_tasks_master'] });
      queryClient.invalidateQueries({ queryKey: ['role_tasks'] });
      showSuccess(`Tác vụ đã được ${editingItem ? 'cập nhật' : 'thêm'} thành công!`);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('event_tasks_master').delete().eq('name', name);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event_tasks_master'] });
      queryClient.invalidateQueries({ queryKey: ['role_tasks'] });
      showSuccess(`Đã xóa tác vụ.`);
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleOpenDialog = (item: { name: string; roles: string[] } | null) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const isLoading = isLoadingTasks || isLoadingRoles || isLoadingRoleTasks;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Danh sách Tác vụ sự kiện</h2>
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Tác vụ
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên Tác vụ</TableHead>
                <TableHead>Áp dụng cho vai trò</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasksWithRoles.length > 0 ? (
                tasksWithRoles.map((item) => (
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
                    Chưa có tác vụ nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AddEditTaskDialog
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

export default TaskSettings;
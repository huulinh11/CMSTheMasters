import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Guest } from "@/types/guest";
import { GuestTask, TaskGuest } from "@/types/event-task";
import { EventTasksTable } from "@/components/event-tasks/EventTasksTable";
import { EventTasksCards } from "@/components/event-tasks/EventTasksCards";
import { ViewGuestSheet } from "@/components/guests/ViewGuestSheet";
import { RoleConfiguration } from "@/types/role-configuration";
import { showSuccess, showError } from "@/utils/toast";

export const RegularTasksTab = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingGuest, setViewingGuest] = useState<TaskGuest | null>(null);

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: roleConfigs = [] } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations', 'Khách mời'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*').eq('type', 'Khách mời');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<GuestTask[]>({
    queryKey: ['guest_tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guest_tasks').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const taskMutation = useMutation({
    mutationFn: async ({ guestId, taskName, isCompleted }: { guestId: string, taskName: string, isCompleted: boolean }) => {
      const { error } = await supabase.from('guest_tasks').upsert({
        guest_id: guestId,
        task_name: taskName,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
        updated_by: 'Admin' // Placeholder for user management
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task_history'] });
      showSuccess("Cập nhật tác vụ thành công!");
    },
    onError: (error) => showError(error.message),
  });

  const combinedGuests = useMemo((): TaskGuest[] => {
    const tasksByGuest = new Map<string, GuestTask[]>();
    tasks.forEach(task => {
      if (!tasksByGuest.has(task.guest_id)) {
        tasksByGuest.set(task.guest_id, []);
      }
      tasksByGuest.get(task.guest_id)!.push(task);
    });

    return guests.map(guest => ({
      ...guest,
      tasks: tasksByGuest.get(guest.id) || [],
    }));
  }, [guests, tasks]);

  const filteredGuests = useMemo(() => {
    return combinedGuests.filter(guest =>
      guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [combinedGuests, searchTerm]);

  const isLoading = isLoadingGuests || isLoadingTasks;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Tìm kiếm theo tên, ID, vai trò..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-white/80"
      />
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <EventTasksCards
          guests={filteredGuests}
          onTaskChange={taskMutation.mutate}
          onViewDetails={setViewingGuest}
        />
      ) : (
        <EventTasksTable
          guests={filteredGuests}
          onTaskChange={taskMutation.mutate}
          onViewDetails={setViewingGuest}
        />
      )}
      <ViewGuestSheet
        guest={viewingGuest as Guest | null}
        open={!!viewingGuest}
        onOpenChange={() => setViewingGuest(null)}
        onEdit={() => {}}
        roleConfigs={roleConfigs}
      />
    </div>
  );
};
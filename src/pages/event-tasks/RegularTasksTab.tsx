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
import { ImagePreviewDialog } from "@/components/event-tasks/ImagePreviewDialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { TaskFilterSheet } from "@/components/event-tasks/TaskFilterSheet";
import { ALL_TASKS } from "@/config/event-tasks";
import { useAuth } from "@/contexts/AuthContext";

export const RegularTasksTab = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { profile, user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewingGuest, setViewingGuest] = useState<TaskGuest | null>(null);
  const [imagePreviewGuest, setImagePreviewGuest] = useState<TaskGuest | null>(null);
  const [roleFilters, setRoleFilters] = useState<string[]>([]);
  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({});

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
    mutationFn: async (variables: { guestId: string; taskName: string; isCompleted: boolean; updatedBy: string }) => {
      const { guestId, taskName, isCompleted, updatedBy } = variables;
      const { error } = await supabase.from('guest_tasks').upsert({
        guest_id: guestId,
        task_name: taskName,
        is_completed: isCompleted,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy,
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

  const handleTaskChange = (payload: { guestId: string; taskName: string; isCompleted: boolean; }) => {
    const updatedBy = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown User';
    taskMutation.mutate({
      ...payload,
      updatedBy,
    });
  };

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
    return combinedGuests.filter(guest => {
      const searchMatch =
        guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.role.toLowerCase().includes(searchTerm.toLowerCase());

      const roleMatch = roleFilters.length === 0 || roleFilters.includes(guest.role);

      const advancedMatch = Object.entries(advancedFilters).every(([taskName, status]) => {
        if (!status || status === 'all') return true;

        const task = guest.tasks.find(t => t.task_name === taskName);
        const isCompleted = task?.is_completed || false;

        if (status === 'completed') return isCompleted;
        if (status === 'not_completed') return !isCompleted;
        return true;
      });

      return searchMatch && roleMatch && advancedMatch;
    });
  }, [combinedGuests, searchTerm, roleFilters, advancedFilters]);

  const isLoading = isLoadingGuests || isLoadingTasks;

  const handleFilterChange = (field: string, value: string) => {
    setAdvancedFilters(prev => ({ ...prev, [field]: value }));
  };
  
  const handleClearFilters = () => {
    setAdvancedFilters({});
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-2">
        <Input
          placeholder="Tìm kiếm theo tên, ID, vai trò..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-white/80 flex-grow"
        />
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto justify-between">
                Lọc vai trò <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {roleConfigs.map((role) => (
                <DropdownMenuCheckboxItem
                  key={role.id}
                  checked={roleFilters.includes(role.name)}
                  onCheckedChange={(checked) => {
                    setRoleFilters(
                      checked ? [...roleFilters, role.name] : roleFilters.filter((r) => r !== role.name)
                    );
                  }}
                >
                  {role.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <TaskFilterSheet
            filters={advancedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            allTasks={ALL_TASKS}
          />
        </div>
      </div>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isMobile ? (
        <EventTasksCards
          guests={filteredGuests}
          onTaskChange={handleTaskChange}
          onViewDetails={setViewingGuest}
          onImageClick={setImagePreviewGuest}
        />
      ) : (
        <EventTasksTable
          guests={filteredGuests}
          onTaskChange={handleTaskChange}
          onViewDetails={setViewingGuest}
          onImageClick={setImagePreviewGuest}
        />
      )}
      <ViewGuestSheet
        guest={viewingGuest as Guest | null}
        open={!!viewingGuest}
        onOpenChange={() => setViewingGuest(null)}
        onEdit={() => {}}
        roleConfigs={roleConfigs}
      />
      <ImagePreviewDialog
        guest={imagePreviewGuest}
        open={!!imagePreviewGuest}
        onOpenChange={() => setImagePreviewGuest(null)}
        guestType="regular"
      />
    </div>
  );
};
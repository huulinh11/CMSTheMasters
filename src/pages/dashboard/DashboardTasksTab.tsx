import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { GuestTask } from "@/types/event-task";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRolePermissions } from "@/hooks/useRolePermissions";

type TaskStat = {
  name: string;
  total: number;
  completed: number;
  uncompleted: number;
};

const isTaskCompleted = (taskName: string, guestId: string, tasks: GuestTask[]): boolean => {
  const task = tasks.find(t => t.guest_id === guestId && t.task_name === taskName);
  return task?.is_completed || false;
};

const DashboardTasksTab = () => {
  const [filter, setFilter] = useState<'all' | 'completed' | 'uncompleted'>('all');
  const [sortOrder, setSortOrder] = useState<'default' | 'progress-asc' | 'progress-desc'>('default');
  const { allTasks, tasksByRole, isLoading: isLoadingPermissions } = useRolePermissions();

  const { data: guests = [], isLoading: isLoadingGuests } = useQuery<Pick<VipGuest | Guest, 'id' | 'role'>[]>({
    queryKey: ['all_guests_for_task_stats'],
    queryFn: async () => {
      const { data: vips, error: vipError } = await supabase.from('vip_guests').select('id, role');
      if (vipError) throw vipError;
      const { data: regulars, error: regularError } = await supabase.from('guests').select('id, role');
      if (regularError) throw regularError;
      return [...(vips || []), ...(regulars || [])];
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

  const taskStats = useMemo((): TaskStat[] => {
    if (isLoadingGuests || isLoadingTasks || isLoadingPermissions) return [];

    return allTasks.map(taskName => {
      const guestsWithTask = guests.filter(g => tasksByRole[g.role]?.includes(taskName));
      const total = guestsWithTask.length;
      const completed = guestsWithTask.filter(g => isTaskCompleted(taskName, g.id, tasks)).length;
      
      return {
        name: taskName,
        total,
        completed,
        uncompleted: total - completed,
      };
    });
  }, [guests, tasks, isLoadingGuests, isLoadingTasks, allTasks, tasksByRole, isLoadingPermissions]);

  const filteredAndSortedStats = useMemo(() => {
    let stats = [...taskStats];

    if (filter === 'completed') {
      stats = stats.filter(s => s.completed === s.total && s.total > 0);
    } else if (filter === 'uncompleted') {
      stats = stats.filter(s => s.uncompleted > 0);
    }

    if (sortOrder === 'progress-asc') {
      stats.sort((a, b) => {
        const progressA = a.total > 0 ? a.completed / a.total : 0;
        const progressB = b.total > 0 ? b.completed / b.total : 0;
        return progressA - progressB;
      });
    } else if (sortOrder === 'progress-desc') {
      stats.sort((a, b) => {
        const progressA = a.total > 0 ? a.completed / a.total : 0;
        const progressB = b.total > 0 ? b.completed / b.total : 0;
        return progressB - progressA;
      });
    }

    return stats;
  }, [taskStats, filter, sortOrder]);

  if (isLoadingGuests || isLoadingTasks || isLoadingPermissions) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-end gap-4">
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
          <SelectTrigger className="w-full md:w-[240px]">
            <SelectValue placeholder="Sắp xếp theo..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Mặc định</SelectItem>
            <SelectItem value="progress-asc">Tiến độ: Thấp đến cao</SelectItem>
            <SelectItem value="progress-desc">Tiến độ: Cao đến thấp</SelectItem>
          </SelectContent>
        </Select>
        <RadioGroup defaultValue="all" onValueChange={(value) => setFilter(value as any)} className="flex items-center space-x-4">
          <div className="flex items-center space-x-2"><RadioGroupItem value="all" id="t1" /><Label htmlFor="t1">All</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="uncompleted" id="t2" /><Label htmlFor="t2">Chưa</Label></div>
          <div className="flex items-center space-x-2"><RadioGroupItem value="completed" id="t3" /><Label htmlFor="t3">Hoàn thành</Label></div>
        </RadioGroup>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedStats.map(stat => (
          <Card key={stat.name}>
            <CardHeader>
              <CardTitle className="text-base">{stat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-500">Tiến độ</span>
                <span className="font-semibold">{stat.completed} / {stat.total}</span>
              </div>
              <Progress value={stat.total > 0 ? (stat.completed / stat.total) * 100 : 0} />
              <div className="flex justify-between items-center text-xs mt-2">
                <span className="text-green-600">Hoàn thành: {stat.completed}</span>
                <span className="text-red-600">Chưa: {stat.uncompleted}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default DashboardTasksTab;
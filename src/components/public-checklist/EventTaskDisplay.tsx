import { GuestTask } from "@/types/event-task";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface EventTaskDisplayProps {
  tasksForRole: string[];
  completedTasks: GuestTask[];
}

export const EventTaskDisplay = ({ tasksForRole, completedTasks }: EventTaskDisplayProps) => {
  const isTaskCompleted = (taskName: string) => {
    return completedTasks.some(t => t.task_name === taskName && t.is_completed);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
      {tasksForRole.map(taskName => (
        <div key={taskName} className="flex items-center space-x-2">
          <Checkbox id={`task-${taskName}`} checked={isTaskCompleted(taskName)} disabled />
          <Label htmlFor={`task-${taskName}`} className="text-slate-700">{taskName}</Label>
        </div>
      ))}
    </div>
  );
};
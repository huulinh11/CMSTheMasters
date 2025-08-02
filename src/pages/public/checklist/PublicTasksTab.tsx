import { Card, CardContent } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const PublicTasksTab = () => {
  const { guest, tasks } = useOutletContext<ChecklistDataContext>();
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  const isTaskCompleted = (taskName: string) => {
    return tasks.some(t => t.task_name === taskName && t.is_completed);
  };

  return (
    <div className="p-4 space-y-4">
      {tasksForRole.map(taskName => (
        <Card key={taskName}>
          <CardContent className="p-3 flex items-center space-x-3">
            <Checkbox id={`task-${taskName}`} checked={isTaskCompleted(taskName)} disabled />
            <Label htmlFor={`task-${taskName}`} className="text-base font-medium text-slate-800">
              {taskName}
            </Label>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PublicTasksTab;
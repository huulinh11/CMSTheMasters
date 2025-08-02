import { Card, CardContent } from "@/components/ui/card";
import { useOutletContext } from "react-router-dom";
import { ChecklistDataContext } from "../PublicChecklist";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PublicTasksTab = () => {
  const { guest, tasks } = useOutletContext<ChecklistDataContext>();
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  const isTaskCompleted = (taskName: string) => {
    return tasks.some(t => t.task_name === taskName && t.is_completed);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <p className="text-lg">Xin chào: <span className="font-bold">{guest.name}</span></p>
        <p className="text-slate-600">{guest.role}</p>
      </div>
      <h2 className="text-xl font-bold text-slate-800 text-center">Tác vụ tại sự kiện</h2>
      <Card>
        <CardContent className="p-3">
          <div className="space-y-2">
            {tasksForRole.map(taskName => {
              const completed = isTaskCompleted(taskName);
              return (
                <div
                  key={taskName}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg transition-colors",
                    completed ? "bg-[#f4e9e0]" : "bg-slate-50"
                  )}
                >
                  <Checkbox
                    id={`task-${taskName}`}
                    checked={completed}
                    disabled
                    className={cn(
                      completed && "data-[state=checked]:bg-[#8c5a3a] data-[state=checked]:border-[#8c5a3a]"
                    )}
                  />
                  <Label
                    htmlFor={`task-${taskName}`}
                    className={cn(
                      "text-base font-medium",
                      completed ? "text-[#8c5a3a]" : "text-slate-800"
                    )}
                  >
                    {taskName}
                  </Label>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicTasksTab;
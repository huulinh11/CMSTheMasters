import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";
import { TaskGuest } from "@/types/event-task";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { TaskHistoryDialog } from "./TaskHistoryDialog";

interface TaskChecklistPopoverProps {
  guest: TaskGuest;
  onTaskChange: (guestId: string, taskName: string, isCompleted: boolean) => void;
}

export const TaskChecklistPopover = ({ guest, onTaskChange }: TaskChecklistPopoverProps) => {
  const [historyModalState, setHistoryModalState] = useState<{ guestId: string; taskName: string } | null>(null);
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  const getTaskStatus = (taskName: string) => {
    const task = guest.tasks.find(t => t.task_name === taskName);
    return task?.is_completed || false;
  };

  const completedCount = tasksForRole.filter(getTaskStatus).length;
  const totalCount = tasksForRole.length;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            {completedCount}/{totalCount} tác vụ
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Danh sách tác vụ</h4>
              <p className="text-sm text-muted-foreground">
                Check vào các tác vụ đã hoàn thành.
              </p>
            </div>
            <ScrollArea className="h-64">
              <div className="grid gap-2 pr-4">
                {tasksForRole.map((taskName) => (
                  <div key={taskName} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`${guest.id}-${taskName}`}
                        checked={getTaskStatus(taskName)}
                        onCheckedChange={(checked) => onTaskChange(guest.id, taskName, !!checked)}
                      />
                      <Label htmlFor={`${guest.id}-${taskName}`} className="text-sm font-normal">
                        {taskName}
                      </Label>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setHistoryModalState({ guestId: guest.id, taskName })}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
      <TaskHistoryDialog
        open={!!historyModalState}
        onOpenChange={(open) => !open && setHistoryModalState(null)}
        guestId={historyModalState?.guestId || null}
        taskName={historyModalState?.taskName || null}
      />
    </>
  );
};
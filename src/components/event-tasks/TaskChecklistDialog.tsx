import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Phone, User } from "lucide-react";
import { TaskGuest } from "@/types/event-task";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { TaskHistoryDialog } from "./TaskHistoryDialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface TaskChecklistDialogProps {
  guest: TaskGuest;
  onTaskChange: (payload: { guestId: string; taskName: string; isCompleted: boolean }) => void;
}

const ChecklistContent = ({ guest, onTaskChange, setHistoryModalState }: { guest: TaskGuest, onTaskChange: TaskChecklistDialogProps['onTaskChange'], setHistoryModalState: (state: { guestId: string; taskName: string; } | null) => void }) => {
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  const getTaskStatus = (taskName: string) => {
    const task = guest.tasks.find(t => t.task_name === taskName);
    return task?.is_completed || false;
  };

  return (
    <div className="grid gap-4 p-4 md:p-6">
      <div className="space-y-1 border-b pb-3 mb-3">
        <h4 className="font-medium leading-none">{guest.name}</h4>
        <p className="text-sm text-muted-foreground flex items-center">
          <User className="w-4 h-4 mr-2" /> {guest.role}
        </p>
        <p className="text-sm text-muted-foreground flex items-center">
          <Phone className="w-4 h-4 mr-2" /> {guest.phone}
        </p>
      </div>
      <div className="space-y-2">
        <h4 className="font-medium leading-none">Danh sách tác vụ</h4>
        <p className="text-sm text-muted-foreground">
          Check vào các tác vụ đã hoàn thành.
        </p>
      </div>
      <ScrollArea className="h-64">
        <div className="grid gap-1 pr-4">
          {tasksForRole.map((taskName) => (
            <div
              key={taskName}
              className={cn(
                "flex items-center justify-between p-2 rounded-md transition-colors",
                getTaskStatus(taskName) && "bg-green-100 hover:bg-green-200"
              )}
            >
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`${guest.id}-${taskName}`}
                  checked={getTaskStatus(taskName)}
                  onCheckedChange={(checked) => onTaskChange({ guestId: guest.id, taskName, isCompleted: !!checked })}
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
  );
};

export const TaskChecklistDialog = ({ guest, onTaskChange }: TaskChecklistDialogProps) => {
  const [open, setOpen] = useState(false);
  const [historyModalState, setHistoryModalState] = useState<{ guestId: string; taskName: string } | null>(null);
  const isMobile = useIsMobile();

  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];
  const completedCount = tasksForRole.filter(taskName => guest.tasks.find(t => t.task_name === taskName)?.is_completed).length;
  const totalCount = tasksForRole.length;

  const triggerButton = (
    <Button variant="outline" size="sm">
      {completedCount}/{totalCount} tác vụ
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent>
            <ChecklistContent guest={guest} onTaskChange={onTaskChange} setHistoryModalState={setHistoryModalState} />
          </DrawerContent>
        </Drawer>
        <TaskHistoryDialog
          open={!!historyModalState}
          onOpenChange={(isOpen) => !isOpen && setHistoryModalState(null)}
          guestId={historyModalState?.guestId || null}
          taskName={historyModalState?.taskName || null}
        />
      </>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="max-w-md">
          <ChecklistContent guest={guest} onTaskChange={onTaskChange} setHistoryModalState={setHistoryModalState} />
        </DialogContent>
      </Dialog>
      <TaskHistoryDialog
        open={!!historyModalState}
        onOpenChange={(isOpen) => !isOpen && setHistoryModalState(null)}
        guestId={historyModalState?.guestId || null}
        taskName={historyModalState?.taskName || null}
      />
    </>
  );
};
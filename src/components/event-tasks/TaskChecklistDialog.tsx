import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, Phone, User, X } from "lucide-react";
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
    <>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center"><User className="w-4 h-4 mr-2" /> {guest.role}</span>
          <span className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {guest.phone}</span>
        </p>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4">
        {tasksForRole.map((taskName) => (
          <div
            key={taskName}
            className={cn(
              "flex items-center justify-between p-2 rounded-md transition-colors",
              getTaskStatus(taskName) && "bg-green-100 hover:bg-green-200"
            )}
          >
            <div className="flex items-start space-x-2 flex-1 min-w-0">
              <Checkbox
                id={`${guest.id}-${taskName}`}
                checked={getTaskStatus(taskName)}
                onCheckedChange={(checked) => onTaskChange({ guestId: guest.id, taskName, isCompleted: !!checked })}
                className="mt-0.5"
              />
              <Label htmlFor={`${guest.id}-${taskName}`} className="text-sm font-normal flex-1">
                {taskName}
              </Label>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => setHistoryModalState({ guestId: guest.id, taskName })}
            >
              <History className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </>
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
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
      {completedCount}/{totalCount} tác vụ
    </Button>
  );

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent className="flex flex-col max-h-[90vh]">
            <DrawerHeader className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <DrawerTitle>{guest.name}</DrawerTitle>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon"><X className="h-5 w-5" /></Button>
              </DrawerClose>
            </DrawerHeader>
            <ScrollArea className="flex-grow">
              <div className="p-4">
                <ChecklistContent guest={guest} onTaskChange={onTaskChange} setHistoryModalState={setHistoryModalState} />
              </div>
            </ScrollArea>
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{guest.name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <ChecklistContent guest={guest} onTaskChange={onTaskChange} setHistoryModalState={setHistoryModalState} />
          </div>
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
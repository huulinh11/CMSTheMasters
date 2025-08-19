import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { History, Phone, User, X } from "lucide-react";
import { TaskGuest } from "@/types/event-task";
import { TaskHistoryDialog } from "./TaskHistoryDialog";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Progress } from "@/components/ui/progress";

interface TaskChecklistDialogProps {
  guest: TaskGuest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskChange: (payload: { guestId: string; taskName: string; isCompleted: boolean }) => void;
  tasksByRole: Record<string, string[]>;
  onViewDetails: (guest: TaskGuest) => void;
}

const ChecklistContent = ({ guest, onTaskChange, setHistoryModalState, tasksByRole }: { guest: TaskGuest, onTaskChange: TaskChecklistDialogProps['onTaskChange'], setHistoryModalState: (state: { guestId: string; taskName: string; } | null) => void, tasksByRole: Record<string, string[]> }) => {
  const tasksForRole = tasksByRole[guest.role] || [];
  const completedCount = tasksForRole.filter(taskName => guest.tasks.find(t => t.task_name === taskName)?.is_completed).length;
  const totalCount = tasksForRole.length;
  const progressValue = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

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
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-slate-600">Tiến độ</span>
            <span className="font-bold text-[#8c5a3a]">{completedCount}/{totalCount} Hoàn thành</span>
        </div>
        <Progress value={progressValue} className="h-2 [&>div]:bg-[#8c5a3a]" />
      </div>
      <div className="grid grid-cols-1 gap-y-2 mt-4">
        {tasksForRole.map((taskName) => (
          <div
            key={taskName}
            className={cn(
              "flex items-center justify-between p-3 rounded-lg transition-colors",
              getTaskStatus(taskName) ? "bg-[#f4e9e0] hover:bg-[#e9dcd1]" : "bg-slate-50 hover:bg-slate-100"
            )}
          >
            <div className="flex items-start space-x-2 flex-1 min-w-0">
              <Checkbox
                id={`${guest.id}-${taskName}`}
                checked={getTaskStatus(taskName)}
                onCheckedChange={(checked) => onTaskChange({ guestId: guest.id, taskName, isCompleted: !!checked })}
                className={cn(
                  "mt-0.5",
                  getTaskStatus(taskName) && "data-[state=checked]:bg-[#8c5a3a] data-[state=checked]:border-[#8c5a3a]"
                )}
              />
              <Label
                htmlFor={`${guest.id}-${taskName}`}
                className={cn(
                  "text-sm font-normal flex-1",
                  getTaskStatus(taskName) && "text-[#8c5a3a]"
                )}
              >
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

export const TaskChecklistDialog = ({ guest, open, onOpenChange, onTaskChange, tasksByRole, onViewDetails }: TaskChecklistDialogProps) => {
  const [historyModalState, setHistoryModalState] = useState<{ guestId: string; taskName: string } | null>(null);
  const isMobile = useIsMobile();

  if (!guest) return null;

  const handleViewDetailsClick = () => {
    onViewDetails(guest);
  };

  if (isMobile) {
    return (
      <>
        <Drawer open={open} onOpenChange={onOpenChange}>
          <DrawerContent className="flex flex-col max-h-[90vh]">
            <DrawerHeader className="flex justify-between items-center p-4 border-b flex-shrink-0">
              <div className="flex-1 min-w-0 flex justify-between items-baseline">
                <DrawerTitle className="truncate">
                  <button onClick={handleViewDetailsClick} className="hover:underline text-left">
                    {guest.name}
                  </button>
                </DrawerTitle>
                <span className="text-sm font-medium text-slate-500 ml-4">{guest.id}</span>
              </div>
              <DrawerClose asChild>
                <Button variant="ghost" size="icon" className="ml-2"><X className="h-5 w-5" /></Button>
              </DrawerClose>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                <ChecklistContent guest={guest} onTaskChange={onTaskChange} setHistoryModalState={setHistoryModalState} tasksByRole={tasksByRole} />
              </div>
            </div>
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md flex flex-col max-h-[80vh]">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex justify-between items-baseline">
              <button onClick={handleViewDetailsClick} className="hover:underline text-left">
                {guest.name}
              </button>
              <span className="text-sm font-medium text-slate-500">{guest.id}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="py-4 pr-6">
              <ChecklistContent guest={guest} onTaskChange={onTaskChange} setHistoryModalState={setHistoryModalState} tasksByRole={tasksByRole} />
            </div>
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
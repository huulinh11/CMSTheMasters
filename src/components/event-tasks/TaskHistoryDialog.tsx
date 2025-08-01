import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { GuestTaskHistory } from "@/types/event-task";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

interface TaskHistoryDialogProps {
  guestId: string | null;
  taskName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TaskHistoryDialog = ({ guestId, taskName, open, onOpenChange }: TaskHistoryDialogProps) => {
  const { data: history = [], isLoading } = useQuery<GuestTaskHistory[]>({
    queryKey: ['task_history', guestId, taskName],
    queryFn: async () => {
      if (!guestId || !taskName) return [];
      const { data, error } = await supabase
        .from('guest_task_history')
        .select('*')
        .eq('guest_id', guestId)
        .eq('task_name', taskName)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!guestId && !!taskName && open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lịch sử tác vụ</DialogTitle>
          <DialogDescription>
            Tác vụ: {taskName}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Hành động</TableHead>
                  <TableHead>Người thực hiện</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.updated_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>
                        {item.is_completed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell>{item.updated_by || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      Chưa có lịch sử.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TaskGuest } from "@/types/event-task";

interface EventTasksTableProps {
  guests: TaskGuest[];
  onViewDetails: (guest: TaskGuest) => void;
  onImageClick: (guest: TaskGuest) => void;
  onOpenChecklist: (guest: TaskGuest) => void;
  tasksByRole: Record<string, string[]>;
}

export const EventTasksTable = ({ guests, onViewDetails, onImageClick, onOpenChecklist, tasksByRole }: EventTasksTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ảnh</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Thông tin phụ</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead>Tác vụ sự kiện</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => {
              const tasksForRole = tasksByRole[guest.role] || [];
              const completedCount = guest.tasks.filter(t => tasksForRole.includes(t.task_name) && t.is_completed).length;
              const totalCount = tasksForRole.length;

              return (
                <TableRow key={guest.id}>
                  <TableCell>
                    <button onClick={() => onImageClick(guest)}>
                      <Avatar>
                        <AvatarImage src={guest.image_url} alt={guest.name} />
                        <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </button>
                  </TableCell>
                  <TableCell>{guest.id}</TableCell>
                  <TableCell className="font-medium">
                    <button onClick={() => onViewDetails(guest)} className="text-left hover:underline">
                      {guest.name}
                    </button>
                  </TableCell>
                  <TableCell>{guest.role}</TableCell>
                  <TableCell>{guest.secondaryInfo || ''}</TableCell>
                  <TableCell>
                    {guest.phone ? (
                      <a href={`tel:${guest.phone}`} className="hover:underline">{guest.phone}</a>
                    ) : (
                      ''
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => onOpenChecklist(guest)}>
                      {completedCount}/{totalCount} tác vụ
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
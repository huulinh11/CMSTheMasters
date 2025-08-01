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
import { TaskChecklistPopover } from "./TaskChecklistPopover";

interface EventTasksTableProps {
  guests: TaskGuest[];
  onTaskChange: (payload: { guestId: string; taskName: string; isCompleted: boolean; }) => void;
  onViewDetails: (guest: TaskGuest) => void;
}

export const EventTasksTable = ({ guests, onTaskChange, onViewDetails }: EventTasksTableProps) => {
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
            <TableHead className="text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.length > 0 ? (
            guests.map((guest) => (
              <TableRow key={guest.id}>
                <TableCell>
                  <Avatar>
                    <AvatarImage src={guest.image_url} alt={guest.name} />
                    <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell>{guest.id}</TableCell>
                <TableCell className="font-medium">{guest.name}</TableCell>
                <TableCell>{guest.role}</TableCell>
                <TableCell>{guest.secondaryInfo || 'N/A'}</TableCell>
                <TableCell>{guest.phone}</TableCell>
                <TableCell>
                  <TaskChecklistPopover guest={guest} onTaskChange={onTaskChange} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="link" onClick={() => onViewDetails(guest)}>Xem</Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                Không tìm thấy kết quả.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Trash2, Edit, GripVertical } from "lucide-react";
import { TimelineEventClientState } from "@/types/timeline";
import { formatDuration } from "@/lib/time";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ParticipantBadge = ({ name }: { name: string }) => (
  <span className="bg-orange-100 text-orange-800 font-bold px-2 py-1 rounded-md text-xs">
    {name}
  </span>
);

interface SortableTableRowProps {
  item: TimelineEventClientState;
  onEdit: (item: TimelineEventClientState) => void;
  onDelete: (id: string) => void;
}

const SortableTableRow = ({ item, onEdit, onDelete }: SortableTableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <button {...attributes} {...listeners} className="cursor-grab p-2">
          <GripVertical className="h-5 w-5 text-slate-400" />
        </button>
      </TableCell>
      <TableCell className="font-bold text-primary">{item.start_time}</TableCell>
      <TableCell>{formatDuration(item.duration_minutes)}</TableCell>
      <TableCell className="whitespace-pre-wrap">{item.content}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-2 max-w-xs">
          {item.participants?.map(p => <ParticipantBadge key={p} name={p} />)}
        </div>
      </TableCell>
      <TableCell className="whitespace-pre-wrap">{item.notes}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

interface TimelineTableProps {
  items: TimelineEventClientState[];
  onEdit: (item: TimelineEventClientState) => void;
  onDelete: (id: string) => void;
}

export const TimelineTable = ({ items, onEdit, onDelete }: TimelineTableProps) => {
  return (
    <div className="rounded-lg border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>Mốc thời gian</TableHead>
            <TableHead>Thời lượng</TableHead>
            <TableHead>Nội dung</TableHead>
            <TableHead>Hoạt động có mặt bạn</TableHead>
            <TableHead>Ghi chú</TableHead>
            <TableHead className="text-right">Tác vụ</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length > 0 ? (
            items.map((item) => (
              <SortableTableRow key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                Chưa có hoạt động nào trong timeline.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
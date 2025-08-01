import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit, GripVertical } from "lucide-react";
import { TimelineEventClientState } from "@/types/timeline";
import { formatDuration } from "@/lib/time";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const ParticipantBadge = ({ name }: { name: string }) => (
  <span className="bg-orange-100 text-orange-800 font-semibold px-2 py-1 rounded-md text-xs">
    {name}
  </span>
);

interface TimelineCardProps {
  item: TimelineEventClientState;
  onEdit: (item: TimelineEventClientState) => void;
  onDelete: (id: string) => void;
}

export const TimelineCard = ({ item, onEdit, onDelete }: TimelineCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-white shadow-sm overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
        <div className="pl-4">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pr-2">
            <div className="flex items-center">
              <div className="text-lg font-bold text-primary">{item.start_time}</div>
              <div className="text-sm text-slate-500 ml-2">({formatDuration(item.duration_minutes)})</div>
            </div>
            <div className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-5 w-5" />
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
              <button {...attributes} {...listeners} className="cursor-grab p-2 touch-none">
                <GripVertical className="h-5 w-5 text-slate-400" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 pb-4 pr-2">
            <p className="text-slate-800 font-semibold text-base whitespace-pre-wrap">{item.content}</p>
            {item.participants && item.participants.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Hoạt động có mặt bạn</p>
                <div className="flex flex-wrap gap-1">
                  {item.participants.map(p => <ParticipantBadge key={p} name={p} />)}
                </div>
              </div>
            )}
            {item.notes && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-500">Ghi chú</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{item.notes}</p>
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </div>
  );
};
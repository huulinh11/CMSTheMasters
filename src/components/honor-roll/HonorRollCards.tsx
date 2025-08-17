import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Edit, GripVertical, Copy } from "lucide-react";
import { HonorCategory } from "@/types/honor-roll";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { showSuccess } from "@/utils/toast";
import React from "react";

interface SortableCardProps {
  category: HonorCategory;
  onEdit: (category: HonorCategory) => void;
  onDelete: (id: string) => void;
}

const SortableCard = ({ category, onEdit, onDelete }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  const handleCopy = (list: { guest_name: string }[] | null | undefined, listName: string) => {
    if (!list || list.length === 0) return;
    const names = list.map(item => item.guest_name).join('\n');
    navigator.clipboard.writeText(names);
    showSuccess(`Đã sao chép danh sách ${listName}!`);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-semibold text-orange-600">{category.name}</CardTitle>
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Edit className="mr-2 h-4 w-4" /> Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDelete(category.id)} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button {...attributes} {...listeners} className="cursor-grab p-2 touch-none">
              <GripVertical className="h-5 w-5 text-slate-400" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium">Vinh danh ({category.honorees?.length || 0})</h4>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(category.honorees, 'vinh danh'); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm text-slate-700 space-y-0.5">
              {category.honorees?.map(h => <p key={h.guest_id}>{h.guest_name}</p>)}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <h4 className="text-sm font-medium">Người trao ({category.presenters?.length || 0})</h4>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleCopy(category.presenters, 'người trao'); }}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-sm text-slate-700 space-y-0.5">
              {category.presenters?.map(p => <p key={p.guest_id}>{p.guest_name}</p>)}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface HonorRollCardsProps {
  categories: HonorCategory[];
  onEdit: (category: HonorCategory) => void;
  onDelete: (id: string) => void;
}

export const HonorRollCards = ({ categories, onEdit, onDelete }: HonorRollCardsProps) => {
  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Chưa có hạng mục nào.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <SortableCard key={category.id} category={category} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
};
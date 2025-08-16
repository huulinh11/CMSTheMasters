import { useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { HonorCategory, HonorCategoryFormValues } from "@/types/honor-roll";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArrowRightLeft, Edit, Trash2, GripVertical, Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from "@dnd-kit/utilities";
import { AddEditCategoryDialog } from "./AddEditCategoryDialog";
import { SwapPresentersDialog } from "./SwapPresentersDialog";

interface SortableTableRowProps {
  category: HonorCategory;
  onEdit: (category: HonorCategory) => void;
  onDelete: (id: string) => void;
}

const SortableTableRow = ({ category, onEdit, onDelete }: SortableTableRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 1 : 0 };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12"><button {...attributes} {...listeners} className="cursor-grab p-2"><GripVertical className="h-5 w-5 text-slate-400" /></button></TableCell>
      <TableCell className="font-medium text-orange-600">{category.name}</TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-start">
            {category.honorees?.map(h => (
              <p key={h.guest_id} className="text-sm py-0.5">{h.guest_name}</p>
            ))}
          </div>
          {category.honorees && category.honorees.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                const names = category.honorees.map(h => h.guest_name).join('\n');
                navigator.clipboard.writeText(names);
                showSuccess("Đã sao chép danh sách!");
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell>{category.honorees?.length || 0}</TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <div className="flex flex-col items-start">
            {category.presenters?.map(p => (
              <p key={p.guest_id} className="text-sm py-0.5">{p.guest_name}</p>
            ))}
          </div>
          {category.presenters && category.presenters.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                const names = category.presenters.map(p => p.guest_name).join('\n');
                navigator.clipboard.writeText(names);
                showSuccess("Đã sao chép danh sách!");
              }}
            >
              <Copy className="h-3 w-3" />
            </Button>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right space-x-2">
        <Button variant="outline" size="icon" onClick={() => onEdit(category)}><Edit className="h-4 w-4" /></Button>
        <Button variant="destructive" size="icon" onClick={() => onDelete(category.id)}><Trash2 className="h-4 w-4" /></Button>
      </TableCell>
    </TableRow>
  );
};

interface HonorRollTabProps {
  categories: HonorCategory[];
  allGuests: (Guest | VipGuest)[];
  vipGuests: VipGuest[];
  roleConfigs: RoleConfiguration[];
}

export const HonorRollTab = ({ categories: initialCategories, allGuests, vipGuests, roleConfigs }: HonorRollTabProps) => {
  const queryClient = useQueryClient();
  const [categories, setCategories] = useState(initialCategories);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HonorCategory | null>(null);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  const presenterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    categories.forEach(c => {
      c.presenters?.forEach(p => {
        counts[p.guest_id] = (counts[p.guest_id] || 0) + 1;
      });
    });
    return counts;
  }, [categories]);

  const mutation = useMutation({
    mutationFn: async ({ values, originalId }: { values: HonorCategoryFormValues, originalId?: string }) => {
      const { error } = await supabase.from('honor_categories').upsert({
        id: originalId,
        name: values.name,
        honorees: values.honorees,
        presenters: values.presenters,
        order: originalId ? categories.find(c => c.id === originalId)!.order : categories.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_categories'] });
      showSuccess(`Hạng mục đã được ${editingCategory ? 'cập nhật' : 'thêm'}!`);
    },
    onError: (error: Error) => showError(error.message),
    onSettled: () => {
      setIsAddEditDialogOpen(false);
      setEditingCategory(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('honor_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_categories'] });
      showSuccess("Đã xóa hạng mục.");
    },
    onError: (error: Error) => showError(error.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      const { error } = await supabase.from('honor_categories').upsert(updates);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['honor_categories'] }),
    onError: (error: Error) => showError(error.message),
  });

  const swapMutation = useMutation({
    mutationFn: async ({ categoryAId, categoryBId }: { categoryAId: string, categoryBId: string }) => {
      const { error } = await supabase.rpc('swap_presenters', { category_a_id: categoryAId, category_b_id: categoryBId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['honor_categories'] });
      showSuccess("Hoán đổi thành công!");
    },
    onError: (error: Error) => showError(error.message),
    onSettled: () => setIsSwapDialogOpen(false),
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      setCategories(newOrder);
      const updates = newOrder.map((item, index) => ({ id: item.id, order: index }));
      reorderMutation.mutate(updates);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setIsSwapDialogOpen(true)}><ArrowRightLeft className="mr-2 h-4 w-4" /> Hoán đổi</Button>
        <Button onClick={() => { setEditingCategory(null); setIsAddEditDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" /> Thêm hạng mục</Button>
      </div>
      <div className="rounded-lg border bg-white">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader><TableRow><TableHead className="w-12"></TableHead><TableHead>Hạng mục</TableHead><TableHead>Danh sách vinh danh</TableHead><TableHead>Số lượng</TableHead><TableHead>Người lên trao</TableHead><TableHead className="text-right">Tác vụ</TableHead></TableRow></TableHeader>
            <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {categories.length > 0 ? (
                  categories.map((category) => (
                    <SortableTableRow key={category.id} category={category} onEdit={setEditingCategory} onDelete={deleteMutation.mutate} />
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-24 text-center">Chưa có hạng mục nào.</TableCell></TableRow>
                )}
              </TableBody>
            </SortableContext>
          </Table>
        </DndContext>
      </div>
      <AddEditCategoryDialog
        open={isAddEditDialogOpen || !!editingCategory}
        onOpenChange={(open) => { if (!open) { setIsAddEditDialogOpen(false); setEditingCategory(null); } else { setIsAddEditDialogOpen(true); } }}
        onSave={({ values, originalId }) => mutation.mutate({ values, originalId })}
        isSaving={mutation.isPending}
        category={editingCategory}
        allGuests={allGuests}
        vipGuests={vipGuests}
        roleConfigs={roleConfigs}
        presenterCounts={presenterCounts}
      />
      <SwapPresentersDialog
        open={isSwapDialogOpen}
        onOpenChange={setIsSwapDialogOpen}
        onSwap={(a, b) => swapMutation.mutate({ categoryAId: a, categoryBId: b })}
        isSwapping={swapMutation.isPending}
        categories={categories}
      />
    </div>
  );
};
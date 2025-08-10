import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { allNavItems, NavItemType } from "@/config/nav";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const SortableMenuItem = ({ item }: { item: NavItemType }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center p-4 bg-white border rounded-lg shadow-sm">
      <button {...attributes} {...listeners} className="cursor-grab touch-none p-2 mr-2">
        <GripVertical className="h-5 w-5 text-slate-400" />
      </button>
      <item.icon className="h-5 w-5 mr-4 text-slate-600" />
      <span className="font-medium text-slate-800">{item.label}</span>
    </div>
  );
};

const MenuSettings = () => {
  const queryClient = useQueryClient();
  const [menuItems, setMenuItems] = useState<NavItemType[]>([]);

  const { data: savedOrder, isLoading, isSuccess } = useQuery<{ item_id: string }[]>({
    queryKey: ['menu_config_order'],
    queryFn: async () => {
      const { data, error } = await supabase.from('menu_config').select('item_id').order('order');
      if (error) throw error;
      return data || [];
    },
  });

  const upsertDefaultOrderMutation = useMutation({
    mutationFn: async (items: { item_id: string; order: number }[]) => {
      const { error } = await supabase.from('menu_config').upsert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_config_order'] });
    }
  });

  useEffect(() => {
    if (isSuccess && savedOrder) {
      if (savedOrder.length > 0) {
        const orderedItems = savedOrder
          .map(item => allNavItems.find(navItem => navItem.id === item.item_id))
          .filter((item): item is NavItemType => !!item);
        
        allNavItems.forEach(defaultItem => {
          if (!orderedItems.find(item => item.id === defaultItem.id)) {
            orderedItems.push(defaultItem);
          }
        });
        setMenuItems(orderedItems);
      } else {
        setMenuItems(allNavItems);
        const defaultOrder = allNavItems.map((item, index) => ({ item_id: item.id, order: index }));
        upsertDefaultOrderMutation.mutate(defaultOrder);
      }
    }
  }, [isSuccess, savedOrder, upsertDefaultOrderMutation]);

  const reorderMutation = useMutation({
    mutationFn: async (items: { item_id: string; order: number }[]) => {
      const { error } = await supabase.from('menu_config').upsert(items);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu_config_order'] });
      queryClient.invalidateQueries({ queryKey: ['auth_state'] }); // To refetch in AuthContext
      showSuccess("Đã cập nhật thứ tự menu!");
    },
    onError: (error: Error) => showError(error.message),
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = menuItems.findIndex((item) => item.id === active.id);
      const newIndex = menuItems.findIndex((item) => item.id === over.id);
      const newOrderItems = arrayMove(menuItems, oldIndex, newIndex);
      setMenuItems(newOrderItems);

      const newOrder = newOrderItems.map((item, index) => ({ item_id: item.id, order: index }));
      reorderMutation.mutate(newOrder);
    }
  };

  if (isLoading && menuItems.length === 0) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-r-lg">
        <h3 className="font-semibold">Hướng dẫn</h3>
        <p className="text-sm text-slate-600">
          Kéo thả để sắp xếp thứ tự menu. Thứ tự mới sẽ được lưu tự động.
          Trên di động, 4 mục đầu tiên sẽ hiển thị trên thanh điều hướng, các mục còn lại sẽ nằm trong "Khác".
        </p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={menuItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {menuItems.map(item => (
              <SortableMenuItem key={item.id} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default MenuSettings;
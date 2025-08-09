import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { TimelineEvent, TimelineEventClientState, TimelineEventFormValues, ParticipantOption } from "@/types/timeline";
import { RoleConfiguration } from "@/types/role-configuration";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Megaphone, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { calculateTimeline } from "@/lib/time";
import { AddEditTimelineItemDialog } from "@/components/timeline/AddEditTimelineItemDialog";
import { TimelineTable } from "@/components/timeline/TimelineTable";
import { TimelineCard } from "@/components/timeline/TimelineCards";
import { Link } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const Timeline = () => {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [items, setItems] = useState<TimelineEventClientState[]>([]);
  const [baseTime, setBaseTime] = useState('08:00');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineEvent | null>(null);

  const { data: dbItems = [], isLoading: isLoadingItems } = useQuery<TimelineEvent[]>({
    queryKey: ['timeline_events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('timeline_events').select('*').order('order', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: publicDbItems = [], isLoading: isLoadingPublicItems } = useQuery<TimelineEvent[]>({
    queryKey: ['public_timeline_events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_timeline_events').select('*').order('order', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    },
  });

  const { data: roles = [] } = useQuery<RoleConfiguration[]>({
    queryKey: ['role_configurations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('role_configurations').select('*');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
  const { data: vipGuests = [] } = useQuery<VipGuest[]>({
    queryKey: ['vip_guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('vip_guests').select('id, name');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });
  const { data: regularGuests = [] } = useQuery<Guest[]>({
    queryKey: ['guests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('guests').select('id, name');
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  useEffect(() => {
    const startTimes = calculateTimeline(dbItems, baseTime);
    setItems(dbItems.map((item, index) => ({
      ...item,
      start_time: startTimes[index] || '00:00',
    })));
  }, [dbItems, baseTime]);

  const isSynced = useMemo(() => {
    if (dbItems.length !== publicDbItems.length) {
      return false;
    }
    if (dbItems.length === 0) {
      return true;
    }

    const normalizeItem = (item: TimelineEvent) => ({
      id: item.id,
      duration_minutes: item.duration_minutes,
      content: item.content,
      notes: item.notes || null,
      participants: item.participants ? [...(item.participants as string[])].sort() : null,
    });

    const adminNormalized = dbItems.map(normalizeItem);
    const publicNormalized = publicDbItems.map(normalizeItem);

    return JSON.stringify(adminNormalized) === JSON.stringify(publicNormalized);
  }, [dbItems, publicDbItems]);

  const participantOptions = useMemo((): ParticipantOption[] => {
    const roleOptions: ParticipantOption[] = roles.map(r => ({ value: r.name, label: r.name, group: 'Vai trò' }));
    const vipGuestOptions: ParticipantOption[] = vipGuests.map(g => ({ value: g.name, label: g.name, group: 'Khách chức vụ' }));
    const regularGuestOptions: ParticipantOption[] = regularGuests.map(g => ({ value: g.name, label: g.name, group: 'Khách mời' }));
    return [...roleOptions, ...vipGuestOptions, ...regularGuestOptions];
  }, [roles, vipGuests, regularGuests]);

  const addOrEditMutation = useMutation({
    mutationFn: async (values: TimelineEventFormValues) => {
      const itemToUpsert = {
        id: editingItem?.id,
        ...values,
        order: editingItem?.order ?? dbItems.length,
      };
      const { error } = await supabase.from('timeline_events').upsert(itemToUpsert);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline_events'] });
      showSuccess(editingItem ? "Cập nhật thành công!" : "Thêm thành công!");
    },
    onError: (error: any) => showError(error.message),
    onSettled: () => {
      setIsDialogOpen(false);
      setEditingItem(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('timeline_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline_events'] });
      showSuccess("Đã xóa mốc thời gian.");
    },
    onError: (error: any) => showError(error.message),
  });

  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; order: number }[]) => {
      const { error } = await supabase.rpc('update_timeline_order', { updates });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['timeline_events'] }),
    onError: (error: any) => showError(error.message),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('publish_timeline');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public_timeline_events'] });
      showSuccess("Timeline đã được công khai!");
    },
    onError: (error: any) => showError(error.message),
  });

  const handleOpenAddDialog = () => {
    setEditingItem(null);
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (item: TimelineEvent) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newOrderItems = arrayMove(items, oldIndex, newIndex);
      setItems(newOrderItems);
      
      const updates = newOrderItems.map((item, index) => ({
        id: item.id,
        order: index,
      }));
      reorderMutation.mutate(updates);
    }
  }

  const isLoading = isLoadingItems || isLoadingPublicItems;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800">Timeline sự kiện</h1>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Label htmlFor="baseTime" className="flex-shrink-0">Giờ bắt đầu</Label>
              <Input
                id="baseTime"
                type="time"
                value={baseTime}
                onChange={(e) => setBaseTime(e.target.value)}
                className="w-full"
              />
            </div>
            <Button onClick={handleOpenAddDialog}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {isMobile ? 'Thêm' : 'Thêm mốc thời gian'}
            </Button>
            <div className="flex items-center gap-2">
              <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || isSynced} className="flex-1">
                <Megaphone className="mr-2 h-4 w-4" />
                {publishMutation.isPending ? 'Đang public...' : 'Public timeline'}
              </Button>
              <Link to="/timeline/public" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-96 w-full" />
        ) : (
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            {isMobile ? (
              <div className="space-y-4">
                {items.map(item => (
                  <TimelineCard key={item.id} item={item} onEdit={handleOpenEditDialog} onDelete={deleteMutation.mutate} />
                ))}
              </div>
            ) : (
              <TimelineTable items={items} onEdit={handleOpenEditDialog} onDelete={deleteMutation.mutate} />
            )}
          </SortableContext>
        )}

        <AddEditTimelineItemDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSubmit={addOrEditMutation.mutate}
          defaultValues={editingItem}
          participantOptions={participantOptions}
        />
      </div>
    </DndContext>
  );
};

export default Timeline;
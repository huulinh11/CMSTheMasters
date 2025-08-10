import { useParams, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { MediaBenefit } from "@/types/media-benefit";
import { GuestTask } from "@/types/event-task";
import { TimelineEvent } from "@/types/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import PublicChecklistLayout from "@/layouts/PublicChecklistLayout";
import PublicHomeTab from "@/pages/public/checklist/PublicHomeTab";
import PublicEventInfoTab from "@/pages/public/checklist/PublicEventInfoTab";
import PublicTasksTab from "@/pages/public/checklist/PublicTasksTab";
import PublicBenefitsTab from "@/pages/public/checklist/PublicBenefitsTab";
import { useEffect, useMemo } from "react";
import { useRolePermissions } from "@/hooks/useRolePermissions";

type CombinedGuest = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời', secondaryInfo?: string, materials?: string };
export type ChecklistDataContext = {
  guest: CombinedGuest;
  mediaBenefit: MediaBenefit | null;
  tasks: GuestTask[];
  timelineEvents: TimelineEvent[];
  tasksByRole: Record<string, string[]>;
  benefitsByRole: Record<string, string[]>;
};

const PublicChecklist = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const queryClient = useQueryClient();
  const { tasksByRole, benefitsByRole, isLoading: isLoadingPermissions } = useRolePermissions();

  const { data, isLoading, error } = useQuery<Omit<ChecklistDataContext, 'tasksByRole' | 'benefitsByRole'> | null>({
    queryKey: ['public_checklist', identifier],
    queryFn: async () => {
      if (!identifier) return null;

      const isPhoneNumber = /^\d+$/.test(identifier);
      const queryColumn = isPhoneNumber ? 'phone' : 'id';

      let guest: CombinedGuest | null = null;
      
      const { data: vipGuest } = await supabase.from('vip_guests').select('*').eq(queryColumn, identifier).single();
      if (vipGuest) {
          guest = { ...vipGuest, type: 'Chức vụ', secondaryInfo: vipGuest.secondary_info, materials: vipGuest.materials };
      } else {
          const { data: regularGuest } = await supabase.from('guests').select('*').eq(queryColumn, identifier).single();
          if (regularGuest) {
              guest = { ...regularGuest, type: 'Khách mời', materials: regularGuest.materials };
          }
      }

      if (!guest) return null;

      const { data: mediaBenefit } = await supabase.from('media_benefits').select('*').eq('guest_id', guest.id).single();
      const { data: tasks } = await supabase.from('guest_tasks').select('*').eq('guest_id', guest.id);
      const { data: timelineEvents } = await supabase.from('public_timeline_events').select('*').order('order');

      return {
        guest,
        mediaBenefit,
        tasks: tasks || [],
        timelineEvents: timelineEvents || [],
      };
    },
    enabled: !!identifier,
  });

  const contextData = useMemo(() => {
    if (!data) return null;
    return { ...data, tasksByRole, benefitsByRole };
  }, [data, tasksByRole, benefitsByRole]);

  useEffect(() => {
    if (!data?.guest.id) return;
    const guestId = data.guest.id;

    const channel = supabase
      .channel(`public-checklist-${guestId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guest_tasks', filter: `guest_id=eq.${guestId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public_checklist', identifier] });
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guest_notifications', filter: `guest_id=in.(${guestId},all)` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['guest_notifications', guestId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [data?.guest.id, identifier, queryClient]);

  if (isLoading || isLoadingPermissions) {
    return (
      <PublicChecklistLayout>
        <div className="p-4">
          <Skeleton className="h-64 w-full" />
        </div>
      </PublicChecklistLayout>
    );
  }

  if (error || !contextData) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">Lỗi</h1>
        <p className="mt-2 text-slate-600">{error ? error.message : "Không tìm thấy thông tin cho số điện thoại hoặc ID này."}</p>
      </div>
    );
  }

  return (
    <PublicChecklistLayout guestId={contextData.guest.id}>
      <Routes>
        <Route path="/" element={<Outlet context={contextData} />}>
          <Route index element={<PublicHomeTab />} />
          <Route path="event-info" element={<PublicEventInfoTab />} />
          <Route path="tasks" element={<PublicTasksTab />} />
          <Route path="benefits" element={<PublicBenefitsTab />} />
          <Route path="*" element={<Navigate to="" replace />} />
        </Route>
      </Routes>
    </PublicChecklistLayout>
  );
};

export default PublicChecklist;
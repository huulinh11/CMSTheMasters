import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { MediaBenefit } from "@/types/media-benefit";
import { GuestTask } from "@/types/event-task";
import { TimelineEvent } from "@/types/timeline";
import { MEDIA_BENEFITS_BY_ROLE } from "@/config/media-benefits-by-role";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { Skeleton } from "@/components/ui/skeleton";
import { ChecklistHeader } from "@/components/public-checklist/ChecklistHeader";
import { ChecklistSection } from "@/components/public-checklist/ChecklistSection";
import { MediaBenefitDisplay } from "@/components/public-checklist/MediaBenefitDisplay";
import { EventTaskDisplay } from "@/components/public-checklist/EventTaskDisplay";
import { TimelineDisplay } from "@/components/public-checklist/TimelineDisplay";

type CombinedGuest = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời', secondaryInfo?: string, materials?: string };
type ChecklistData = {
  guest: CombinedGuest;
  mediaBenefit: MediaBenefit | null;
  tasks: GuestTask[];
  timelineEvents: TimelineEvent[];
};

const PublicChecklist = () => {
  const { phone } = useParams<{ phone: string }>();

  const { data, isLoading, error } = useQuery<ChecklistData | null>({
    queryKey: ['public_checklist', phone],
    queryFn: async () => {
      if (!phone) return null;

      let guest: CombinedGuest | null = null;
      const { data: vipGuest } = await supabase.from('vip_guests').select('*').eq('phone', phone).single();
      if (vipGuest) {
        guest = { ...vipGuest, type: 'Chức vụ', secondaryInfo: vipGuest.secondary_info };
      } else {
        const { data: regularGuest } = await supabase.from('guests').select('*').eq('phone', phone).single();
        if (regularGuest) {
          guest = { ...regularGuest, type: 'Khách mời' };
        }
      }

      if (!guest) return null;

      const { data: mediaBenefit } = await supabase.from('media_benefits').select('*').eq('guest_id', guest.id).single();
      const { data: tasks } = await supabase.from('guest_tasks').select('*').eq('guest_id', guest.id);
      const { data: timelineEvents } = await supabase.from('timeline_events').select('*').order('order');

      const relevantTimelineEvents = (timelineEvents || []).filter(event => 
        event.participants?.some(p => p === guest!.name || p === guest!.role)
      );

      return {
        guest,
        mediaBenefit,
        tasks: tasks || [],
        timelineEvents: relevantTimelineEvents,
      };
    },
    enabled: !!phone,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-4">
        <Skeleton className="h-24 w-full mb-8" />
        <Skeleton className="h-48 w-full mb-8" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-4 text-center">
        <h1 className="text-2xl font-bold text-red-600">Lỗi</h1>
        <p className="mt-2 text-slate-600">{error ? error.message : "Không tìm thấy thông tin cho số điện thoại này."}</p>
      </div>
    );
  }

  const { guest, mediaBenefit, tasks, timelineEvents } = data;
  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  return (
    <div className="max-w-4xl mx-auto my-4 md:my-8 bg-white shadow-lg rounded-lg overflow-hidden">
      <ChecklistHeader guest={guest} />
      
      {guest.type === 'Chức vụ' && guest.materials && (
        <ChecklistSection title="Tư liệu">
          <p className="text-slate-700 whitespace-pre-wrap">{guest.materials}</p>
        </ChecklistSection>
      )}

      <ChecklistSection title="Quyền lợi truyền thông">
        <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
      </ChecklistSection>

      <ChecklistSection title="Tác vụ sự kiện">
        <EventTaskDisplay tasksForRole={tasksForRole} completedTasks={tasks} />
      </ChecklistSection>

      <ChecklistSection title="Timeline">
        <TimelineDisplay events={timelineEvents} />
      </ChecklistSection>
    </div>
  );
};

export default PublicChecklist;
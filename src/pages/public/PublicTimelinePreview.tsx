import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TimelineEvent } from "@/types/timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { calculateTimeline, formatDuration } from "@/lib/time";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PublicTimelinePreview = () => {
  const { data: events = [], isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['public_timeline_events_preview'],
    queryFn: async () => {
      const { data, error } = await supabase.from('public_timeline_events').select('*').order('order');
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-4 md:p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Timeline sự kiện</h1>
        <p className="text-slate-500">Timeline chưa được công khai.</p>
      </div>
    );
  }

  const startTimes = calculateTimeline(events, '08:00');

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-6 text-slate-800">Timeline Sự Kiện (Public Preview)</h1>
      <div className="max-w-3xl mx-auto space-y-4">
        {events.map((event, index) => (
          <Card key={event.id} className="bg-white shadow-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary" />
            <div className="pl-4">
              <CardHeader className="flex flex-row items-center justify-between pb-2 pr-2">
                <div className="flex items-center">
                  <div className="text-lg font-bold text-primary">{startTimes[index]}</div>
                  <div className="text-sm text-slate-500 ml-2">({formatDuration(event.duration_minutes)})</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 pb-4 pr-2">
                <p className="text-slate-800 font-semibold text-base whitespace-pre-wrap">{event.content}</p>
                {event.participants && (event.participants as string[]).length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Hoạt động có mặt</p>
                    <div className="flex flex-wrap gap-1">
                      {(event.participants as string[]).map(p => (
                        <span key={p} className="bg-orange-100 text-orange-800 font-semibold px-2 py-1 rounded-md text-xs">{p}</span>
                      ))}
                    </div>
                  </div>
                )}
                {event.notes && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-slate-500">Ghi chú</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{event.notes}</p>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PublicTimelinePreview;
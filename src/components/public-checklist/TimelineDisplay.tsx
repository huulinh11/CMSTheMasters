import { TimelineEvent } from "@/types/timeline";
import { calculateTimeline } from "@/lib/time";

interface TimelineDisplayProps {
  events: TimelineEvent[];
}

export const TimelineDisplay = ({ events }: TimelineDisplayProps) => {
  if (events.length === 0) {
    return <p className="text-slate-500">Không có hoạt động nào trong timeline.</p>;
  }

  const startTimes = calculateTimeline(events);

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="flex items-start space-x-4">
          <div className="text-primary font-bold text-lg w-16 text-right flex-shrink-0">{startTimes[index]}</div>
          <div className="border-l-2 border-primary pl-4 flex-1">
            <h3 className="font-semibold text-slate-800">{event.content}</h3>
            {event.notes && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{event.notes}</p>}
          </div>
        </div>
      ))}
    </div>
  );
};
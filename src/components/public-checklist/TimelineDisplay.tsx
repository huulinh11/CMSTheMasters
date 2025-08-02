import React from "react";
import { TimelineEvent } from "@/types/timeline";
import { calculateTimeline } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";

type CombinedGuest = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời' };

interface TimelineDisplayProps {
  events: TimelineEvent[];
  guest: CombinedGuest;
}

export const TimelineDisplay = ({ events, guest }: TimelineDisplayProps) => {
  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 md:p-6">
          <p className="text-slate-500">Không có hoạt động nào trong timeline.</p>
        </CardContent>
      </Card>
    );
  }

  const startTimes = calculateTimeline(events);

  const getParticipantText = (event: TimelineEvent): string | null => {
    if (!event.participants) return null;

    const participantNameMatch = event.participants.find(p => p === guest.name);
    if (participantNameMatch) {
        return `Cần bạn ${guest.name} có mặt`;
    }

    const participantRoleMatch = event.participants.find(p => p === guest.role);
    if (participantRoleMatch) {
        return `${guest.role} cần có mặt`;
    }

    return null;
  };

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div>
          {events.map((event, index) => {
            const participantText = getParticipantText(event);
            return (
              <React.Fragment key={event.id}>
                <div className="flex items-start space-x-4">
                  <div className="font-bold text-lg w-16 text-right flex-shrink-0 text-slate-800">{startTimes[index]}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">
                      {event.content}
                    </h3>
                    {event.notes && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{event.notes}</p>}
                    {participantText && (
                      <p className="text-sm font-semibold text-red-600 mt-1">({participantText})</p>
                    )}
                  </div>
                </div>
                {index < events.length - 1 && <Separator className="my-4" />}
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  );
};
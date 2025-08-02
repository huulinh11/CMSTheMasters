import React, { useState, useMemo } from "react";
import { TimelineEvent } from "@/types/timeline";
import { calculateTimeline } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

type CombinedGuest = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời' };

interface TimelineDisplayProps {
  events: TimelineEvent[];
  guest: CombinedGuest;
}

export const TimelineDisplay = ({ events, guest }: TimelineDisplayProps) => {
  const [filter, setFilter] = useState<'all' | 'role' | 'name'>('all');

  const getParticipantInfo = (event: TimelineEvent): { text: string; type: 'name' | 'role' } | null => {
    if (!event.participants) return null;

    const participantNameMatch = event.participants.find(p => p === guest.name);
    if (participantNameMatch) {
        return { text: `Cần bạn ${guest.name} có mặt`, type: 'name' };
    }

    const participantRoleMatch = event.participants.find(p => p === guest.role);
    if (participantRoleMatch) {
        return { text: `${guest.role} cần có mặt`, type: 'role' };
    }

    return null;
  };

  const filteredEvents = useMemo(() => {
    if (filter === 'all') {
      return events;
    }
    return events.filter(event => {
      if (!event.participants) return false;
      if (filter === 'role') {
        return event.participants.includes(guest.role);
      }
      if (filter === 'name') {
        return event.participants.includes(guest.name);
      }
      return false;
    });
  }, [events, filter, guest.name, guest.role]);

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 md:p-6">
          <p className="text-slate-500">Không có hoạt động nào trong timeline.</p>
        </CardContent>
      </Card>
    );
  }

  const startTimes = calculateTimeline(filteredEvents);

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-4">
          <Label>Lọc theo:</Label>
          <RadioGroup value={filter} onValueChange={(value) => setFilter(value as any)} className="flex gap-x-6 gap-y-2 flex-wrap">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="filter-all" />
              <Label htmlFor="filter-all" className="font-normal">Tất cả</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="role" id="filter-role" />
              <Label htmlFor="filter-role" className="font-normal">Vai trò của bạn</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="name" id="filter-name" />
              <Label htmlFor="filter-name" className="font-normal">Đích danh bạn</Label>
            </div>
          </RadioGroup>
        </div>
        <Separator />
        <div className="mt-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => {
              const participantInfo = getParticipantInfo(event);
              return (
                <React.Fragment key={event.id}>
                  <div className="flex items-start space-x-4">
                    <div className="font-bold text-lg w-16 text-right flex-shrink-0 text-primary">{startTimes[index]}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">
                        {event.content}
                      </h3>
                      {event.notes && <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{event.notes}</p>}
                      {participantInfo && (
                        <p className={cn(
                          "text-sm font-semibold mt-1",
                          participantInfo.type === 'name' ? "text-red-600 italic" : "text-primary"
                        )}>
                          ({participantInfo.text})
                        </p>
                      )}
                    </div>
                  </div>
                  {index < filteredEvents.length - 1 && <Separator className="my-4" />}
                </React.Fragment>
              )
            })
          ) : (
            <p className="text-center text-slate-500 py-8">Không có hoạt động nào khớp với bộ lọc.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
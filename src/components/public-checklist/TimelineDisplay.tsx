import React, { useState, useMemo } from "react";
import { TimelineEvent } from "@/types/timeline";
import { calculateTimeline } from "@/lib/time";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
        <div className="flex justify-center mb-4">
          <Select value={filter} onValueChange={(value) => setFilter(value as 'all' | 'role' | 'name')}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="Lọc theo..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hoạt động</SelectItem>
              <SelectItem value="role">Hoạt động theo vai trò</SelectItem>
              <SelectItem value="name">Hoạt động có mặt bạn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Separator />
        <div className="mt-4">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => {
              const participantInfo = getParticipantInfo(event);
              return (
                <React.Fragment key={event.id}>
                  <div className="flex items-start space-x-4">
                    <div className="font-bold text-lg w-16 text-right flex-shrink-0 text-slate-800">{startTimes[index]}</div>
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
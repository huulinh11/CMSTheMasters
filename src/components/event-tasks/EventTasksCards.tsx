import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TaskGuest } from "@/types/event-task";
import { Phone, Camera } from "lucide-react";

interface EventTasksCardsProps {
  guests: TaskGuest[];
  onViewDetails: (guest: TaskGuest) => void;
  onImageClick: (guest: TaskGuest) => void;
  onOpenChecklist: (guest: TaskGuest) => void;
  tasksByRole: Record<string, string[]>;
}

export const EventTasksCards = ({ guests, onViewDetails, onImageClick, onOpenChecklist, tasksByRole }: EventTasksCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => {
          const tasksForRole = tasksByRole[guest.role] || [];
          const completedCount = guest.tasks.filter(t => tasksForRole.includes(t.task_name) && t.is_completed).length;
          const totalCount = tasksForRole.length;

          return (
            <Card key={guest.id} className="bg-white shadow-sm overflow-hidden">
              <div className="flex">
                <div className="w-2/5 flex-shrink-0">
                  <button onClick={() => onImageClick(guest)} className="w-full h-full aspect-[3/4] bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
                    {guest.image_url ? (
                      <img src={guest.image_url} alt={guest.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>
                <div className="w-3/5 p-3 flex flex-col justify-between">
                  <div className="flex-grow cursor-pointer" onClick={() => onViewDetails(guest)}>
                    <h3 className="text-base font-bold leading-tight hover:underline">{guest.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{guest.role}</p>
                    <p className="text-xs text-muted-foreground">{guest.id}</p>
                    {guest.secondaryInfo && <p className="text-xs mt-1 text-slate-600">{guest.secondaryInfo}</p>}
                    <div className="flex items-center text-xs mt-1">
                      <Phone className="mr-1.5 h-3 w-3 text-muted-foreground" />
                      {guest.phone ? (
                        <a href={`tel:${guest.phone}`} className="hover:underline">{guest.phone}</a>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChecklist(guest)} className="w-full">
                      {completedCount}/{totalCount} tác vụ
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Không tìm thấy khách mời nào.</p>
        </div>
      )}
    </div>
  );
};
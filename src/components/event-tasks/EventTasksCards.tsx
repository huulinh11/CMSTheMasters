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
                <div className="w-1/3 flex-shrink-0">
                  <button onClick={() => onImageClick(guest)} className="w-full h-full aspect-[3/4] bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center">
                    {guest.image_url ? (
                      <img src={guest.image_url} alt={guest.name} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="h-8 w-8 text-slate-400" />
                    )}
                  </button>
                </div>
                <div className="w-2/3 p-3 flex flex-col justify-between">
                  <div className="flex-grow">
                    <h3 className="text-base font-bold leading-tight">{guest.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{guest.role}</p>
                    <p className="text-xs text-muted-foreground">{guest.id}</p>
                    {guest.secondaryInfo && <p className="text-xs mt-1 text-slate-600">{guest.secondaryInfo}</p>}
                    <div className="flex items-center text-xs mt-1">
                      <Phone className="mr-1.5 h-3 w-3 text-muted-foreground" />
                      <span>{guest.phone}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mt-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => onOpenChecklist(guest)}>
                      {completedCount}/{totalCount} tác vụ
                    </Button>
                    <Button variant="link" size="sm" className="p-0 h-auto text-sm" onClick={() => onViewDetails(guest)}>Xem chi tiết</Button>
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
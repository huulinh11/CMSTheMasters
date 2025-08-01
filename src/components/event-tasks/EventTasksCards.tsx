import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TaskGuest } from "@/types/event-task";
import { TaskChecklistPopover } from "./TaskChecklistPopover";
import { Phone } from "lucide-react";

interface EventTasksCardsProps {
  guests: TaskGuest[];
  onTaskChange: (guestId: string, taskName: string, isCompleted: boolean) => void;
  onViewDetails: (guest: TaskGuest) => void;
}

export const EventTasksCards = ({ guests, onTaskChange, onViewDetails }: EventTasksCardsProps) => {
  return (
    <div className="space-y-4">
      {guests.length > 0 ? (
        guests.map((guest) => (
          <Card key={guest.id} className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={guest.image_url} alt={guest.name} />
                <AvatarFallback>{guest.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle>{guest.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{guest.role}</p>
                <p className="text-sm text-muted-foreground">{guest.id}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {guest.secondaryInfo && <p className="text-sm">{guest.secondaryInfo}</p>}
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{guest.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <TaskChecklistPopover guest={guest} onTaskChange={onTaskChange} />
                <Button variant="link" onClick={() => onViewDetails(guest)}>Xem chi tiết</Button>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-12 text-slate-500">
          <p>Không tìm thấy khách mời nào.</p>
        </div>
      )}
    </div>
  );
};
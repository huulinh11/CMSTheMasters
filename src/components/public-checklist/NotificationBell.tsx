import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import useGuestNotifications from "@/hooks/useGuestNotifications";
import { NotificationDialog } from "./NotificationDialog";

interface NotificationBellProps {
  guestId: string;
}

export const NotificationBell = ({ guestId }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markOneAsRead, readIds } = useGuestNotifications(guestId);

  return (
    <>
      <Button
        variant="ghost"
        className="relative h-auto w-auto p-2 rounded-full"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-12 w-12" />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-base font-bold rounded-full h-7 w-7 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>
      <NotificationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        notifications={notifications}
        readIds={readIds}
        onMarkOneAsRead={markOneAsRead}
        onMarkAllAsRead={markAllAsRead}
      />
    </>
  );
};
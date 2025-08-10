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
  const { notifications, unreadCount, markAllAsRead } = useGuestNotifications(guestId);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setIsOpen(true)}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
        )}
      </Button>
      <NotificationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        notifications={notifications}
        onMarkAllAsRead={markAllAsRead}
      />
    </>
  );
};
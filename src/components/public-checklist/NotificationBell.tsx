import { useState } from "react";
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
      <button
        onClick={() => setIsOpen(true)}
        className="relative inline-flex items-center justify-center rounded-full h-16 w-16 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
      >
        <Bell className="h-12 w-12" />
        {unreadCount > 0 && (
          <div className="absolute top-1 right-1 bg-red-500 text-white text-sm font-bold rounded-full h-6 w-6 flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>
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
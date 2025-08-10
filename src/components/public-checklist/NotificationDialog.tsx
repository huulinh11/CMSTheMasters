import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GuestNotification } from "@/types/notification";
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { BellRing, CheckCheck } from "lucide-react";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: GuestNotification[];
  onMarkAllAsRead: () => void;
}

export const NotificationDialog = ({ open, onOpenChange, notifications, onMarkAllAsRead }: NotificationDialogProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Thông báo</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4">
          <div className="space-y-4 pr-6">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className="flex items-start gap-3">
                  <div className="bg-primary/10 p-2 rounded-full mt-1">
                    <BellRing className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-800">{notification.content}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-slate-500 py-12">
                <p>Bạn chưa có thông báo nào.</p>
              </div>
            )}
          </div>
        </ScrollArea>
        <SheetFooter>
          <Button className="w-full" onClick={onMarkAllAsRead} disabled={notifications.length === 0}>
            <CheckCheck className="mr-2 h-4 w-4" /> Đánh dấu tất cả đã đọc
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
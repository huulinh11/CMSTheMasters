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
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import React from "react";

interface NotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: GuestNotification[];
  readIds: Set<string>;
  onMarkOneAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationDialog = ({ open, onOpenChange, notifications, readIds, onMarkOneAsRead, onMarkAllAsRead }: NotificationDialogProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col h-[75vh]">
        <SheetHeader>
          <SheetTitle>Thông báo</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-grow my-4">
          <div className="pr-6">
            {notifications.length > 0 ? (
              notifications.map((notification, index) => {
                const isRead = readIds.has(notification.id);
                return (
                  <React.Fragment key={notification.id}>
                    <button
                      className={cn(
                        "flex items-start gap-3 text-left p-2 rounded-lg w-full transition-colors",
                        isRead ? "hover:bg-slate-50" : "hover:bg-primary/5"
                      )}
                      onClick={() => onMarkOneAsRead(notification.id)}
                    >
                      <div className={cn("p-2 rounded-full mt-1", isRead ? "bg-slate-100" : "bg-primary/10")}>
                        <BellRing className={cn("h-3 w-3", isRead ? "text-slate-400" : "text-primary")} />
                      </div>
                      <div>
                        <p className={cn("text-sm", isRead ? "text-slate-500" : "text-slate-800")}>{notification.content}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    </button>
                    {index < notifications.length - 1 && <Separator className="my-2 bg-slate-200" />}
                  </React.Fragment>
                )
              })
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
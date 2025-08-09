import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChecklistDataContext } from "@/pages/public/PublicChecklist";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GuestQrCode } from "./GuestQrCode";
import { TimelineDisplay } from "./TimelineDisplay";
import { EventTaskDisplay } from "./EventTaskDisplay";
import { MediaBenefitDisplay } from "./MediaBenefitDisplay";
import { TASKS_BY_ROLE } from "@/config/event-tasks";
import { MEDIA_BENEFITS_BY_ROLE } from "@/config/media-benefits-by-role";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";

interface MemberCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ChecklistDataContext;
}

const MemberCardContent = ({ data }: { data: ChecklistDataContext }) => {
  const { guest, mediaBenefit, tasks, timelineEvents } = data;
  const benefitsForRole = MEDIA_BENEFITS_BY_ROLE[guest.role] || [];
  const tasksForRole = TASKS_BY_ROLE[guest.role] || [];

  const handleCopyLink = () => {
    if (!guest.phone) {
      showError("Khách mời này không có SĐT để tạo link.");
      return;
    }
    const url = `${window.location.origin}/checklist/${guest.phone}`;
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép link checklist!");
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Thông tin</TabsTrigger>
          <TabsTrigger value="event">Sự kiện</TabsTrigger>
          <TabsTrigger value="tasks">Tác vụ</TabsTrigger>
          <TabsTrigger value="benefits">Quyền lợi</TabsTrigger>
        </TabsList>
        <TabsContent value="info" className="mt-4">
          <div className="space-y-4">
            <GuestQrCode guestId={guest.id} guestName={guest.name} />
            <Button className="w-full" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" /> Sao chép link checklist
            </Button>
          </div>
        </TabsContent>
        <TabsContent value="event" className="mt-4">
          <TimelineDisplay events={timelineEvents} guest={guest} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-4">
          <EventTaskDisplay tasksForRole={tasksForRole} completedTasks={tasks} />
        </TabsContent>
        <TabsContent value="benefits" className="mt-4">
          <MediaBenefitDisplay benefits={benefitsForRole} mediaBenefitData={mediaBenefit} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export const MemberCardDialog = ({ open, onOpenChange, data }: MemberCardDialogProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Thẻ thành viên: {data.guest.name}</DrawerTitle>
          </DrawerHeader>
          <ScrollArea>
            <MemberCardContent data={data} />
          </ScrollArea>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Thẻ thành viên: {data.guest.name}</DialogTitle>
        </DialogHeader>
        <ScrollArea>
          <MemberCardContent data={data} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
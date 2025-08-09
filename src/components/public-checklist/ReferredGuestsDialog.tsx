import { useState, useEffect } from "react";
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
import { Copy, ArrowLeft } from "lucide-react";
import { showSuccess, showError } from "@/utils/toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "../ui/skeleton";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";

type CombinedGuest = (Guest | VipGuest) & { type: 'Chức vụ' | 'Khách mời' };

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

const ReferredGuestDetailView = ({ guest, onBack }: { guest: CombinedGuest, onBack: () => void }) => {
  const { data, isLoading } = useQuery<ChecklistDataContext | null>({
    queryKey: ['public_checklist_detail', guest.id],
    queryFn: async () => {
      const { data: mediaBenefit } = await supabase.from('media_benefits').select('*').eq('guest_id', guest.id).single();
      const { data: tasks } = await supabase.from('guest_tasks').select('*').eq('guest_id', guest.id);
      const { data: timelineEvents } = await supabase.from('public_timeline_events').select('*').order('order');

      return {
        guest,
        mediaBenefit,
        tasks: tasks || [],
        timelineEvents: timelineEvents || [],
      };
    },
  });

  return (
    <div className="p-4">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
      </Button>
      {isLoading ? <Skeleton className="h-96 w-full" /> : data ? <MemberCardContent data={data} /> : <p>Không thể tải dữ liệu.</p>}
    </div>
  );
};

interface ReferredGuestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referrerName: string;
  referredGuests: CombinedGuest[];
}

export const ReferredGuestsDialog = ({ open, onOpenChange, referrerName, referredGuests }: ReferredGuestsDialogProps) => {
  const [selectedGuest, setSelectedGuest] = useState<CombinedGuest | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) {
      setSelectedGuest(null);
    }
  }, [open]);

  const DialogComponent = isMobile ? Drawer : Dialog;
  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;

  return (
    <DialogComponent open={open} onOpenChange={onOpenChange}>
      <DialogContentComponent className={isMobile ? "h-[90vh]" : "max-w-4xl h-[90vh] flex flex-col"}>
        <DialogHeader>
          <DialogTitle>
            {selectedGuest ? `Thẻ thành viên: ${selectedGuest.name}` : `Thành viên do ${referrerName} giới thiệu`}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1">
          {selectedGuest ? (
            <ReferredGuestDetailView guest={selectedGuest} onBack={() => setSelectedGuest(null)} />
          ) : (
            <div className="p-4 space-y-2">
              {referredGuests.map(g => (
                <div key={g.id} onClick={() => setSelectedGuest(g)} className="cursor-pointer p-3 hover:bg-slate-100 rounded-lg border">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-sm text-slate-500">{g.role}</p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContentComponent>
    </DialogComponent>
  );
};
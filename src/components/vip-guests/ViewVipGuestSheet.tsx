import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { VipGuest } from "@/types/vip-guest";
import { Phone, User, Info, FileText } from "lucide-react";

interface ViewVipGuestSheetProps {
  guest: VipGuest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value?: string }) => {
  if (!value) return null;
  return (
    <div className="flex items-start py-2">
      <Icon className="h-4 w-4 mr-3 mt-1 flex-shrink-0 text-slate-500" />
      <div className="flex-1">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
};

const GuestDetails = ({ guest }: { guest: VipGuest }) => (
  <div className="space-y-2 divide-y divide-slate-100">
    <InfoItem icon={Phone} label="SĐT" value={guest.phone} />
    <InfoItem icon={Info} label="Thông tin phụ" value={guest.secondaryInfo} />
    <InfoItem icon={User} label="Người giới thiệu" value={guest.referrer} />
    <InfoItem icon={FileText} label="Ghi chú" value={guest.notes} />
  </div>
);

export const ViewVipGuestSheet = ({ guest, open, onOpenChange }: ViewVipGuestSheetProps) => {
  const isMobile = useIsMobile();

  if (!guest) return null;

  const title = guest.name;
  const description = `${guest.role} - ID: ${guest.id}`;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <GuestDetails guest={guest} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <GuestDetails guest={guest} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
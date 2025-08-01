import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Guest } from "@/types/guest";
import { Phone, User, FileText, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleConfiguration } from "@/types/role-configuration";

interface ViewGuestSheetProps {
  guest: Guest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (guest: Guest) => void;
  roleConfigs: RoleConfiguration[];
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

const GuestDetails = ({ guest }: { guest: Guest }) => (
  <div className="space-y-2 divide-y divide-slate-100">
    <InfoItem icon={Phone} label="SĐT" value={guest.phone} />
    <InfoItem icon={User} label="Người giới thiệu" value={guest.referrer} />
    <InfoItem icon={FileText} label="Ghi chú" value={guest.notes} />
  </div>
);

export const ViewGuestSheet = ({ guest, open, onOpenChange, onEdit, roleConfigs }: ViewGuestSheetProps) => {
  const isMobile = useIsMobile();

  if (!guest) return null;

  const getRoleColors = (roleName: string) => {
    const config = roleConfigs.find(rc => rc.name === roleName);
    return {
      backgroundColor: config?.bg_color || '#EFF6FF',
      color: config?.text_color || '#1E40AF',
    };
  };

  const title = guest.name;
  const descriptionComponent = (
    <div className="flex items-center mt-1">
      <span 
        className="px-2 py-1 rounded-md text-sm font-medium"
        style={getRoleColors(guest.role)}
      >
        {guest.role}
      </span>
      <span className="text-slate-500 ml-1.5">({guest.id})</span>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription asChild>{descriptionComponent}</DrawerDescription>
          </DrawerHeader>
          <div className="p-4">
            <GuestDetails guest={guest} />
          </div>
          <DrawerFooter>
            <Button onClick={() => onEdit(guest)}>
              <Edit className="mr-2 h-4 w-4" /> Sửa
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription asChild>{descriptionComponent}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <GuestDetails guest={guest} />
        </div>
        <DialogFooter>
          <Button onClick={() => onEdit(guest)}>
            <Edit className="mr-2 h-4 w-4" /> Sửa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { VipGuest } from "@/types/vip-guest";
import { Guest } from "@/types/guest";
import { showSuccess } from "@/utils/toast";

type CombinedGuest = (VipGuest | Guest) & { type: 'Chức vụ' | 'Khách mời' };

interface GuestQrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: CombinedGuest | null;
}

const QrCodeDisplay = ({ value, label }: { value: string | null, label: string }) => {
  if (!value) {
    return <div className="text-center text-slate-500 p-8">Không có link để tạo mã QR.</div>;
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    showSuccess("Đã sao chép link!");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <div className="p-4 bg-white rounded-lg border">
        <QRCodeCanvas value={value} size={256} />
      </div>
      <div className="w-full max-w-xs flex items-center gap-2">
        <Input value={value} readOnly className="flex-grow" />
        <Button variant="outline" size="icon" onClick={handleCopy}>
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
};

export const GuestQrCodeDialog = ({ open, onOpenChange, guest }: GuestQrCodeDialogProps) => {
  if (!guest) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const checkinUrl = `${origin}/event-tasks?guestId=${guest.id}`;
  const checklistUrl = `${origin}/checklist/${guest.id}`;
  const profileUrl = guest.slug ? `${origin}/profile/${guest.slug}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Mã QR cho {guest.name}</DialogTitle>
          <DialogDescription>
            Sử dụng các mã QR này cho các mục đích khác nhau.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="checkin" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="checklist" disabled={!checklistUrl}>Checklist</TabsTrigger>
            <TabsTrigger value="profile" disabled={!profileUrl}>Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="checkin">
            <QrCodeDisplay value={checkinUrl} label="Dùng để check-in và cập nhật tác vụ tại sự kiện." />
          </TabsContent>
          <TabsContent value="checklist">
            <QrCodeDisplay value={checklistUrl} label="Link đến trang checklist cá nhân của khách mời." />
          </TabsContent>
          <TabsContent value="profile">
            <QrCodeDisplay value={profileUrl} label="Link đến trang profile public của khách mời." />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
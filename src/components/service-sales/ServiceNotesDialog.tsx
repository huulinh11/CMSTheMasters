import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ServiceNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  serviceName: string;
  guestName: string;
}

export const ServiceNotesDialog = ({ open, onOpenChange, notes, serviceName, guestName }: ServiceNotesDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi chú cho dịch vụ "{serviceName}"</DialogTitle>
          <DialogDescription>Khách mời: {guestName}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-64 mt-4">
          <p className="whitespace-pre-wrap p-1">{notes}</p>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
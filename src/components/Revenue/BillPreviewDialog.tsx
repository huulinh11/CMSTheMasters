import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BillPreviewDialogProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BillPreviewDialog = ({ imageUrl, open, onOpenChange }: BillPreviewDialogProps) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-2">
        <DialogHeader className="p-4">
          <DialogTitle>Xem Bill</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex justify-center items-center max-h-[80vh] overflow-auto">
          <img src={imageUrl} alt="Bill" className="max-w-full h-auto object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BillPreviewDialog;
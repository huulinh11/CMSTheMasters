import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImagePreviewDialogProps {
  imageUrl: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImagePreviewDialog = ({ imageUrl, open, onOpenChange }: ImagePreviewDialogProps) => {
  if (!imageUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-2">
        <DialogHeader className="p-4">
          <DialogTitle>Xem trước ảnh</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex justify-center items-center max-h-[80vh] overflow-auto">
          <img src={imageUrl} alt="Preview" className="max-w-full h-auto object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

interface EditLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (link: string) => void;
  title: string;
  initialValue?: string | null;
}

export const EditLinkDialog = ({ open, onOpenChange, onSave, title, initialValue }: EditLinkDialogProps) => {
  const [link, setLink] = useState("");

  useEffect(() => {
    if (open) {
      setLink(initialValue || "");
    }
  }, [open, initialValue]);

  const handleSave = () => {
    onSave(link);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Nhập hoặc dán link vào ô bên dưới và nhấn lưu.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="link-input">Link</Label>
          <Input
            id="link-input"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
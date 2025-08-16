import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HonorCategory } from "@/types/honor-roll";
import { useState } from "react";
import { ArrowRightLeft } from "lucide-react";

interface SwapPresentersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwap: (categoryAId: string, categoryBId: string) => void;
  isSwapping: boolean;
  categories: HonorCategory[];
}

export const SwapPresentersDialog = ({ open, onOpenChange, onSwap, isSwapping, categories }: SwapPresentersDialogProps) => {
  const [categoryA, setCategoryA] = useState<string>("");
  const [categoryB, setCategoryB] = useState<string>("");

  const handleSwap = () => {
    if (categoryA && categoryB && categoryA !== categoryB) {
      onSwap(categoryA, categoryB);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hoán đổi người trao</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center gap-4 py-4">
          <Select value={categoryA} onValueChange={setCategoryA}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Chọn hạng mục 1" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
          <ArrowRightLeft className="h-6 w-6 text-slate-500 flex-shrink-0" />
          <Select value={categoryB} onValueChange={setCategoryB}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Chọn hạng mục 2" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSwap} disabled={isSwapping || !categoryA || !categoryB || categoryA === categoryB}>
            {isSwapping ? 'Đang hoán đổi...' : 'Hoán đổi'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HonorCategory, HonorCategoryFormValues } from "@/types/honor-roll";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { useState, useEffect, useMemo } from "react";
import { GuestMultiSelect } from "./GuestMultiSelect";

interface AddEditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { values: HonorCategoryFormValues, originalId?: string }) => void;
  isSaving: boolean;
  category: HonorCategory | null;
  allGuests: (Guest | VipGuest)[];
  vipGuests: VipGuest[];
  roleConfigs: RoleConfiguration[];
  presenterCounts: Record<string, number>;
}

export const AddEditCategoryDialog = ({ open, onOpenChange, onSave, isSaving, category, allGuests, vipGuests, roleConfigs, presenterCounts }: AddEditCategoryDialogProps) => {
  const [name, setName] = useState('');
  const [honorees, setHonorees] = useState<{ guest_id: string; guest_name: string }[]>([]);
  const [presenters, setPresenters] = useState<{ guest_id: string; guest_name: string }[]>([]);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setHonorees(category.honorees || []);
      setPresenters(category.presenters || []);
    } else {
      setName('');
      setHonorees([]);
      setPresenters([]);
    }
  }, [category, open]);

  const handleSave = () => {
    onSave({ values: { name, honorees, presenters }, originalId: category?.id });
  };

  const presentersWithCount = useMemo(() => {
    return vipGuests.map(g => ({
      ...g,
      name: `${g.name} (${presenterCounts[g.id] || 0})`,
    }));
  }, [vipGuests, presenterCounts]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{category ? 'Sửa Hạng mục' : 'Thêm Hạng mục mới'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">Tên Hạng mục</Label>
            <Input id="category-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Danh sách vinh danh</Label>
            <GuestMultiSelect
              allGuests={allGuests}
              roleConfigs={roleConfigs}
              selected={honorees}
              onChange={setHonorees}
              placeholder="Chọn người được vinh danh..."
            />
          </div>
          <div className="space-y-2">
            <Label>Người lên trao</Label>
            <GuestMultiSelect
              allGuests={presentersWithCount}
              roleConfigs={roleConfigs.filter(r => r.type === 'Chức vụ')}
              selected={presenters}
              onChange={setPresenters}
              placeholder="Chọn người lên trao..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
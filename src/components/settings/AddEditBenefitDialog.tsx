import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RoleConfiguration } from "@/types/role-configuration";
import { useState, useEffect } from "react";
import { RoleMultiSelect } from "./RoleMultiSelect";

interface AddEditBenefitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { name: string; roles: string[]; originalName?: string }) => void;
  isSaving: boolean;
  item: { name: string; roles: string[] } | null;
  allRoles: RoleConfiguration[];
}

export const AddEditBenefitDialog = ({ open, onOpenChange, onSave, isSaving, item, allRoles }: AddEditBenefitDialogProps) => {
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSelectedRoles(item.roles);
    } else {
      setName('');
      setSelectedRoles([]);
    }
  }, [item, open]);

  const handleSave = () => {
    onSave({ name, roles: selectedRoles, originalName: item?.name });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Sửa Quyền lợi' : 'Thêm Quyền lợi mới'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="benefit-name">Tên Quyền lợi</Label>
            <Input id="benefit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Áp dụng cho vai trò</Label>
            <RoleMultiSelect
              options={allRoles}
              selected={selectedRoles}
              onChange={setSelectedRoles}
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
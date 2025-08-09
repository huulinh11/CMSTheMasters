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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoleConfiguration } from "@/types/role-configuration";
import { useState, useEffect } from "react";
import { RoleMultiSelect } from "./RoleMultiSelect";
import { BenefitFieldType, BENEFIT_FIELD_TYPES, benefitFieldTypeLabels } from "@/types/benefit-configuration";

interface AddEditBenefitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: { name: string; roles: string[]; field_type: BenefitFieldType; originalName?: string }) => void;
  isSaving: boolean;
  item: { name: string; roles: string[]; field_type: BenefitFieldType } | null;
  allRoles: RoleConfiguration[];
}

export const AddEditBenefitDialog = ({ open, onOpenChange, onSave, isSaving, item, allRoles }: AddEditBenefitDialogProps) => {
  const [name, setName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [fieldType, setFieldType] = useState<BenefitFieldType>('simple_link');

  useEffect(() => {
    if (item) {
      setName(item.name);
      setSelectedRoles(item.roles);
      setFieldType(item.field_type);
    } else {
      setName('');
      setSelectedRoles([]);
      setFieldType('simple_link');
    }
  }, [item, open]);

  const handleSave = () => {
    onSave({ name, roles: selectedRoles, field_type: fieldType, originalName: item?.name });
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
            <Label htmlFor="field-type">Loại trường</Label>
            <Select value={fieldType} onValueChange={(value) => setFieldType(value as BenefitFieldType)}>
              <SelectTrigger id="field-type">
                <SelectValue placeholder="Chọn loại trường" />
              </SelectTrigger>
              <SelectContent>
                {BENEFIT_FIELD_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {benefitFieldTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
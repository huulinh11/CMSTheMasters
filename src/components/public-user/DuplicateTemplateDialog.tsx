import { useState, useEffect } from "react";
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
import { ProfileTemplate } from "@/types/profile-template";
import { RoleConfiguration } from "@/types/role-configuration";
import { RoleMultiSelect } from "../settings/RoleMultiSelect";

interface DuplicateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDuplicate: (payload: { name: string; roles: string[] }) => void;
  isDuplicating: boolean;
  template: ProfileTemplate | null;
  allRoles: RoleConfiguration[];
}

export const DuplicateTemplateDialog = ({
  open,
  onOpenChange,
  onDuplicate,
  isDuplicating,
  template,
  allRoles,
}: DuplicateTemplateDialogProps) => {
  const [name, setName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (template) {
      setName(`Bản sao của ${template.name}`);
      setSelectedRoles([]); // Bắt đầu không có vai trò nào được gán
    }
  }, [template, open]);

  const handleDuplicate = () => {
    if (template) {
      onDuplicate({ name, roles: selectedRoles });
    }
  };

  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhân bản Template</DialogTitle>
          <DialogDescription>
            Tạo một bản sao của "{template.name}" với tên và vai trò mới.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Tên Template mới</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Gán cho vai trò (mặc định)</Label>
            <RoleMultiSelect
              options={allRoles}
              selected={selectedRoles}
              onChange={setSelectedRoles}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleDuplicate} disabled={isDuplicating || !name}>
            {isDuplicating ? "Đang nhân bản..." : "Nhân bản"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
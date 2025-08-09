import { useState, useEffect, useMemo } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileTemplate } from "@/types/profile-template";
import { RoleConfiguration } from "@/types/role-configuration";
import { EditProfileDialog } from "./EditProfileDialog";
import { ContentBlock } from "@/types/profile-content";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Partial<ProfileTemplate>) => void;
  isSaving: boolean;
  template: Partial<ProfileTemplate> | null;
  allRoles: RoleConfiguration[];
  templates: ProfileTemplate[];
}

export const EditTemplateDialog = ({
  open,
  onOpenChange,
  onSave,
  isSaving,
  template,
  allRoles,
  templates,
}: EditTemplateDialogProps) => {
  const [name, setName] = useState("");
  const [assignedRole, setAssignedRole] = useState<string | null>(null);
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || "");
        setAssignedRole(template.assigned_role || null);
        setContent(template.content || []);
      } else {
        setName("");
        setAssignedRole(null);
        setContent([]);
      }
    }
  }, [template, open]);

  const assignedRoleConflict = useMemo(() => {
    if (!assignedRole) return null;
    const conflictingTemplate = templates.find(
      t => t.assigned_role === assignedRole && t.id !== template?.id
    );
    return conflictingTemplate;
  }, [assignedRole, templates, template]);

  const handleSave = () => {
    onSave({
      id: template?.id,
      name,
      assigned_role: assignedRole,
      content,
    });
  };

  const mockGuest = {
    id: "template-editor",
    name: "Xem trước Template",
    role: "Template",
    phone: "",
    type: "Chức vụ" as const,
    profile_content: content,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {template?.id ? "Chỉnh sửa Template" : "Tạo Template mới"}
          </DialogTitle>
          <DialogDescription>
            Thiết kế cấu trúc và gán vai trò mặc định cho template.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
          <div>
            <Label htmlFor="template-name">Tên Template</Label>
            <Input
              id="template-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="assigned-role">Gán cho vai trò (mặc định)</Label>
            <Select
              value={assignedRole || "NONE"}
              onValueChange={(value) => setAssignedRole(value === "NONE" ? null : value)}
            >
              <SelectTrigger id="assigned-role">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Không có</SelectItem>
                {allRoles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assignedRoleConflict && (
              <p className="text-red-500 text-xs mt-1">
                Đã có template "{assignedRoleConflict.name}" gán vai trò này.
              </p>
            )}
          </div>
        </div>
        <div className="flex-grow min-h-0">
          <EditProfileDialog
            open={true}
            onOpenChange={() => {}}
            guest={mockGuest}
            onSave={() => {}}
            onContentChange={setContent}
            isSaving={false}
            onUploadingChange={setIsUploading}
            isTemplateMode={false}
            isSubDialog={true}
          />
        </div>
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isUploading}>
            {isSaving || isUploading ? "Đang lưu..." : "Lưu Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
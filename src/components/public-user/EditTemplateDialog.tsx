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
import { ProfileTemplate } from "@/types/profile-template";
import { RoleConfiguration } from "@/types/role-configuration";
import { ContentBlock } from "@/types/profile-content";
import { TemplateEditor } from "./TemplateEditor";
import { RoleMultiSelect } from "../settings/RoleMultiSelect";

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
  const [assignedRoles, setAssignedRoles] = useState<string[]>([]);
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (open) {
      if (template) {
        setName(template.name || "");
        setAssignedRoles(template.assigned_roles || []);
        setContent(template.content || []);
      } else {
        setName("");
        setAssignedRoles([]);
        setContent([]);
      }
    }
  }, [template, open]);

  const roleToTemplateMap = useMemo(() => {
    const map = new Map<string, string>();
    templates.forEach(t => {
      if (t.id !== template?.id && t.assigned_roles) {
        t.assigned_roles.forEach(role => {
          map.set(role, t.name);
        });
      }
    });
    return map;
  }, [templates, template]);

  const conflicts = useMemo(() => {
    return assignedRoles
      .map(role => ({ role, templateName: roleToTemplateMap.get(role) }))
      .filter(item => !!item.templateName);
  }, [assignedRoles, roleToTemplateMap]);

  const handleSave = () => {
    onSave({
      id: template?.id,
      name,
      assigned_roles: assignedRoles,
      content,
    });
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
            <RoleMultiSelect
              options={allRoles}
              selected={assignedRoles}
              onChange={setAssignedRoles}
            />
            {conflicts.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {conflicts.map(conflict => (
                  <p key={conflict.role} className="text-red-500 text-xs">
                    Vai trò "{conflict.role}" đã được gán cho template "{conflict.templateName}".
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-grow min-h-0">
          <TemplateEditor
            content={content}
            onContentChange={setContent}
            onUploadingChange={setIsUploading}
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
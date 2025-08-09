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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfileTemplate } from "@/types/profile-template";
import { RoleConfiguration } from "@/types/role-configuration";
import { ContentBlock, TextBlock, TextBlockItem } from "@/types/profile-content";
import { PlusCircle, Image as ImageIcon, Video, Type } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { ScrollArea } from "@/components/ui/scroll-area";
import { EditProfileDialog } from "./EditProfileDialog";

interface EditTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (template: Partial<ProfileTemplate>) => void;
  isSaving: boolean;
  template: Partial<ProfileTemplate> | null;
  allRoles: RoleConfiguration[];
}

export const EditTemplateDialog = ({
  open,
  onOpenChange,
  onSave,
  isSaving,
  template,
  allRoles,
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

  const handleSave = () => {
    onSave({
      id: template?.id,
      name,
      assigned_role: assignedRole,
      content,
    });
  };

  const handleAddBlock = (type: 'image' | 'video' | 'text') => {
    let newBlock: ContentBlock;
    const base = { id: uuidv4() };
    if (type === 'image') {
      newBlock = { ...base, type: 'image', imageUrl: '', linkUrl: '', imageSourceType: 'url', width: 100 };
    } else if (type === 'video') {
      newBlock = { ...base, type: 'video', videoUrl: '' };
    } else {
      newBlock = { 
        ...base, 
        type: 'text', 
        items: [], 
        backgroundImageUrl: '', 
        imageSourceType: 'url' 
      };
    }
    setContent(prev => [...prev, newBlock]);
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
        <DialogFooter className="flex-shrink-0 pt-4 border-t justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('image')}><ImageIcon className="mr-2 h-4 w-4" /> Thêm ảnh</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('video')}><Video className="mr-2 h-4 w-4" /> Thêm video</Button>
            <Button variant="outline" size="sm" onClick={() => handleAddBlock('text')}><Type className="mr-2 h-4 w-4" /> Thêm text</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isUploading}>
              {isSaving || isUploading ? "Đang lưu..." : "Lưu Template"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { ProfileTemplate } from "@/types/profile-template";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TemplateManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: ProfileTemplate[];
  onAdd: () => void;
  onEdit: (template: ProfileTemplate) => void;
  onDelete: (templateId: string) => void;
  onAssign: () => void;
}

export const TemplateManagementDialog = ({
  open,
  onOpenChange,
  templates,
  onAdd,
  onEdit,
  onDelete,
  onAssign,
}: TemplateManagementDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quản lý Template</DialogTitle>
          <DialogDescription>
            Thêm, sửa, xóa và gán các mẫu profile cho khách mời.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ScrollArea className="h-72 pr-4">
            <div className="space-y-2">
              {templates.length > 0 ? (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-md"
                  >
                    <div>
                      <p className="font-medium">{template.name}</p>
                      {template.assigned_role && (
                        <p className="text-xs text-muted-foreground">
                          Mặc định cho: {template.assigned_role}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(template.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Chưa có template nào.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={onAdd}>
              <PlusCircle className="mr-2 h-4 w-4" /> Thêm Template
            </Button>
            <Button onClick={onAssign}>Gán Template</Button>
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
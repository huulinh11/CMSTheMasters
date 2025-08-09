import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Edit, Save } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { ChecklistDataContext } from "@/pages/public/PublicChecklist";

interface MaterialsViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest: ChecklistDataContext['guest'];
}

export const MaterialsViewerDialog = ({ open, onOpenChange, guest }: MaterialsViewerDialogProps) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [materials, setMaterials] = useState(guest.materials || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setMaterials(guest.materials || "");
      setIsEditing(false);
    }
  }, [open, guest.materials]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, materials]);

  const mutation = useMutation({
    mutationFn: async (newMaterials: string) => {
      const tableName = guest.type === 'Chức vụ' ? 'vip_guests' : 'guests';
      const { error } = await supabase
        .from(tableName)
        .update({ materials: newMaterials })
        .eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public_checklist', guest.phone] });
      queryClient.invalidateQueries({ queryKey: ['public_checklist', guest.id] });
      showSuccess("Cập nhật tư liệu thành công!");
      setIsEditing(false);
    },
    onError: (error: Error) => {
      showError(`Lỗi: ${error.message}`);
    }
  });

  const handleSave = () => {
    mutation.mutate(materials);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(materials);
    showSuccess("Đã sao chép tư liệu!");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tư liệu của {guest.name}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Chỉnh sửa nội dung tư liệu của bạn." : "Xem lại nội dung tư liệu đã cung cấp."}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isEditing ? (
            <Textarea
              ref={textareaRef}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="min-h-[200px] max-h-[60vh] resize-y"
              autoFocus
            />
          ) : (
            <ScrollArea className="max-h-[60vh] w-full rounded-md border p-4">
              <div className="whitespace-pre-wrap">{materials || "Chưa có tư liệu."}</div>
            </ScrollArea>
          )}
        </div>
        <DialogFooter>
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
              <Button onClick={handleSave} disabled={mutation.isPending}>
                <Save className="mr-2 h-4 w-4" /> {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCopy} disabled={!materials}>
                <Copy className="mr-2 h-4 w-4" /> Sao chép
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" /> Sửa
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
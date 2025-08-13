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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface EditServiceNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: { id: string; notes: string | null; serviceName: string; guestName: string; guestId: string; } | null;
}

export const EditServiceNotesDialog = ({ open, onOpenChange, service }: EditServiceNotesDialogProps) => {
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (service) {
      setNotes(service.notes || "");
    }
  }, [service]);

  const mutation = useMutation({
    mutationFn: async (newNotes: string) => {
      if (!service) throw new Error("Service not found");
      const { error } = await supabase
        .from('guest_services')
        .update({ notes: newNotes })
        .eq('id', service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_service_details'] });
      if (service) {
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'vip', service.guestId] });
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'regular', service.guestId] });
      }
      showSuccess("Cập nhật ghi chú thành công!");
      onOpenChange(false);
    },
    onError: (err: Error) => showError(err.message),
  });

  const handleSave = () => {
    mutation.mutate(notes);
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ghi chú cho dịch vụ "{service.serviceName}"</DialogTitle>
          <DialogDescription>Khách mời: {service.guestName}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhập ghi chú..."
            rows={6}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
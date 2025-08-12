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
import { Input } from "@/components/ui/input";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { v4 as uuidv4 } from 'uuid';
import { Upload } from "lucide-react";

interface ServicePayment {
  id: string;
  bill_image_url?: string | null;
}

interface EditServicePaymentDialogProps {
  payment: ServicePayment | null;
  guestId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditServicePaymentDialog = ({ payment, guestId, open, onOpenChange }: EditServicePaymentDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && payment) {
      setPreviewUrl(payment.bill_image_url || null);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [open, payment]);

  const mutation = useMutation({
    mutationFn: async (newImageUrl: string) => {
      if (!payment) throw new Error("Payment not found");
      const { error } = await supabase
        .from('service_payments')
        .update({ bill_image_url: newImageUrl })
        .eq('id', payment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_history', guestId] });
      showSuccess("Cập nhật bill thành công!");
      onOpenChange(false);
    },
    onError: (err: Error) => showError(err.message),
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !payment || !guestId) return;
    setIsUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${guestId}-service-${uuidv4()}.${fileExt}`;
      const filePath = `public/bills/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrl) {
        mutation.mutate(publicUrl);
      } else {
        throw new Error("Không thể lấy URL của ảnh.");
      }
    } catch (error: any) {
      showError(`Lỗi: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Bill thanh toán</DialogTitle>
          <DialogDescription>Tải lên hình ảnh bill mới để thay thế.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center my-4">
          {previewUrl ? (
            <img src={previewUrl} alt="Bill preview" className="max-h-[40vh] max-w-full rounded-md object-contain" />
          ) : (
            <div className="h-48 w-full bg-slate-100 rounded-md flex items-center justify-center">
              <p className="text-slate-500">Chưa có bill</p>
            </div>
          )}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Chọn ảnh mới
          </Button>
          <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          <Button onClick={handleSave} disabled={!selectedFile || isUploading || mutation.isPending}>
            {isUploading ? 'Đang tải...' : (mutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskGuest } from "@/types/event-task";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { showSuccess, showError } from "@/utils/toast";
import { Upload, Library } from "lucide-react";
import { ImageLibraryDialog } from "../image-library/ImageLibraryDialog";

interface ImagePreviewDialogProps {
  guest: TaskGuest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guestType: 'vip' | 'regular';
}

export const ImagePreviewDialog = ({ guest, open, onOpenChange, guestType }: ImagePreviewDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPreviewUrl(guest?.image_url || null);
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [open, guest]);

  const mutation = useMutation({
    mutationFn: async (newImageUrl: string) => {
      if (!guest) throw new Error("Guest not found");
      const tableName = guestType === 'vip' ? 'vip_guests' : 'guests';
      const { error } = await supabase
        .from(tableName)
        .update({ image_url: newImageUrl })
        .eq('id', guest.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vip_guests'] });
      queryClient.invalidateQueries({ queryKey: ['guests'] });
      showSuccess("Cập nhật ảnh đại diện thành công!");
      onOpenChange(false);
    },
    onError: (err: Error) => {
      showError(`Lỗi: ${err.message}`);
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !guest) return;

    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${guest.id}-${Date.now()}.${fileExt}`;
    const filePath = `image-library/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedFile);

    if (uploadError) {
      showError(`Lỗi tải ảnh lên: ${uploadError.message}`);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    if (publicUrl) {
      mutation.mutate(publicUrl);
    } else {
      showError("Không thể lấy URL công khai của ảnh.");
    }
  };

  const handleSelectFromLibrary = (url: string) => {
    setPreviewUrl(url);
    setSelectedFile(null); // Clear file selection
    mutation.mutate(url); // Directly save the selected URL
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ảnh đại diện: {guest?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center items-center my-4">
            {previewUrl ? (
              <img src={previewUrl} alt={guest?.name} className="max-h-[60vh] max-w-full rounded-md object-contain" />
            ) : (
              <div className="h-64 w-full bg-slate-100 rounded-md flex items-center justify-center">
                <p className="text-slate-500">Chưa có ảnh</p>
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Tải ảnh mới
              </Button>
              <Button variant="outline" onClick={() => setIsLibraryOpen(true)}>
                <Library className="mr-2 h-4 w-4" />
                Chọn từ thư viện
              </Button>
            </div>
            <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <Button onClick={handleUpload} disabled={!selectedFile || mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu ảnh đã tải'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ImageLibraryDialog
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onSelect={handleSelectFromLibrary}
      />
    </>
  );
};
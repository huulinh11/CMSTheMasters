import { useState, useId } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { showError } from "@/utils/toast";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  guestId: string;
  onUploading?: (isUploading: boolean) => void;
}

export const ImageUploader = ({ onUploadSuccess, guestId, onUploading }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const inputId = useId();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    onUploading?.(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `profile-content/${guestId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (publicUrl) {
        onUploadSuccess(publicUrl);
      } else {
        throw new Error("Không thể lấy URL của ảnh.");
      }
    } catch (error: any) {
      showError(`Lỗi tải ảnh: ${error.message}`);
    } finally {
      setIsUploading(false);
      onUploading?.(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => document.getElementById(inputId)?.click()}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
      </Button>
      <input
        type="file"
        id={inputId}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
    </>
  );
};
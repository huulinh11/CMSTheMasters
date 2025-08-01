import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { showError } from "@/utils/toast";

interface ImageUploaderProps {
  onUploadSuccess: (url: string) => void;
  guestId: string;
}

export const ImageUploader = ({ onUploadSuccess, guestId }: ImageUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => document.getElementById(`file-input-${guestId}`)?.click()}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? 'Đang tải...' : 'Tải ảnh lên'}
      </Button>
      <input
        type="file"
        id={`file-input-${guestId}`}
        className="hidden"
        onChange={handleFileChange}
        accept="image/*"
      />
    </>
  );
};
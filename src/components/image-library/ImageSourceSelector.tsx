import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ImageUploader } from "./ImageUploader";
import { ImageLibraryDialog } from "./ImageLibraryDialog";
import { Library } from "lucide-react";

interface ImageSourceSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  onUploadingChange?: (isUploading: boolean) => void;
}

export const ImageSourceSelector = ({ value, onValueChange, onUploadingChange }: ImageSourceSelectorProps) => {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  return (
    <div className="space-y-2">
      <Input
        placeholder="Dán URL hình ảnh..."
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
      />
      <div className="flex gap-2">
        <ImageUploader
          onUploadSuccess={onValueChange}
          onUploading={onUploadingChange}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => setIsLibraryOpen(true)}>
          <Library className="mr-2 h-4 w-4" />
          Chọn từ thư viện
        </Button>
      </div>
      <ImageLibraryDialog
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        onSelect={onValueChange}
      />
    </div>
  );
};
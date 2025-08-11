import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const BUCKET_NAME = 'avatars';
const FOLDER_NAME = 'image-library';

interface ImageLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export const ImageLibraryDialog = ({ open, onOpenChange, onSelect }: ImageLibraryDialogProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['image-library-files-dialog'],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(FOLDER_NAME, {
          limit: 1000,
          sortBy: { column: 'created_at', order: 'desc' },
        });
      if (error) throw error;
      return data.map(file => ({
        ...file,
        publicURL: supabase.storage.from(BUCKET_NAME).getPublicUrl(`${FOLDER_NAME}/${file.name}`).data.publicUrl
      }));
    },
    enabled: open,
  });

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectImage = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn ảnh từ Thư viện</DialogTitle>
          <DialogDescription>Nhấn vào một ảnh để chọn.</DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ảnh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <ScrollArea className="flex-grow -mx-6">
          <div className="px-6">
            {isLoading ? (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredFiles.map(file => (
                  <button
                    key={file.id}
                    className="aspect-square border rounded-lg overflow-hidden focus:ring-2 focus:ring-primary focus:outline-none"
                    onClick={() => handleSelectImage(file.publicURL)}
                  >
                    <img src={file.publicURL} alt={file.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
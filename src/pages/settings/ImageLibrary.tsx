import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError, showLoading, dismissToast } from "@/utils/toast";
import { Upload, Copy, Trash2, Search } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { SimplePagination } from "@/components/SimplePagination";

const BUCKET_NAME = 'avatars';
const FOLDER_NAME = 'image-library';
const ITEMS_PER_PAGE = 18;

const ImageLibrary = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const { session } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['image-library-files', currentPage],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list(FOLDER_NAME, {
          limit: ITEMS_PER_PAGE + 1, // Fetch one extra to check for next page
          offset: (currentPage - 1) * ITEMS_PER_PAGE,
          sortBy: { column: 'created_at', order: 'desc' },
        });
      if (error) throw error;
      
      const hasNextPage = data.length > ITEMS_PER_PAGE;
      const files = data.slice(0, ITEMS_PER_PAGE).map(file => ({
        ...file,
        publicURL: supabase.storage.from(BUCKET_NAME).getPublicUrl(`${FOLDER_NAME}/${file.name}`).data.publicUrl
      }));

      return { files, hasNextPage };
    }
  });

  const files = data?.files || [];
  const hasNextPage = data?.hasNextPage || false;

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${FOLDER_NAME}/${fileName}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-library-files'] });
      showSuccess("Tải ảnh lên thành công!");
    },
    onError: (error: Error) => {
      showError(`Lỗi tải ảnh: ${error.message}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileName: string) => {
      if (!session) {
        throw new Error("Xác thực không hợp lệ.");
      }

      const { data, error } = await supabase.functions.invoke('manage-images', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: { 
          method: 'DELETE_IMAGE',
          payload: { fileName }
        },
      });

      if (error) {
        if (error.name === 'FunctionsHttpError') {
          const errorBody = await error.context.json();
          throw new Error(errorBody.error || 'Lỗi khi xóa ảnh.');
        }
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['image-library-files'] });
      showSuccess("Xóa ảnh thành công!");
    },
    onError: (error: Error) => {
      showError(`Lỗi xóa ảnh: ${error.message}`);
    },
    onSettled: () => {
      setDeletingFile(null);
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const toastId = showLoading(`Đang tải lên ${files.length} ảnh...`);
    try {
      await Promise.all(Array.from(files).map(file => uploadMutation.mutateAsync(file)));
    } finally {
      dismissToast(toastId);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    showSuccess("Đã sao chép URL!");
  };

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm ảnh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
          <Upload className="mr-2 h-4 w-4" />
          {uploadMutation.isPending ? 'Đang tải...' : 'Tải ảnh mới'}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*"
          multiple
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFiles.map(file => (
            <div key={file.id} className="group relative aspect-square border rounded-lg overflow-hidden">
              <img src={file.publicURL} alt={file.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                <p className="text-white text-xs truncate">{file.name}</p>
                <div className="flex gap-1 mt-1">
                  <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleCopyUrl(file.publicURL)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => setDeletingFile(file.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SimplePagination currentPage={currentPage} onPageChange={setCurrentPage} hasNextPage={hasNextPage} />

      <AlertDialog open={!!deletingFile} onOpenChange={(open) => !open && setDeletingFile(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Hình ảnh sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingFile && deleteMutation.mutate(deletingFile)}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ImageLibrary;
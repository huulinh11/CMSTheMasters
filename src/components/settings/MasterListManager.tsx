import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { showSuccess, showError } from "@/utils/toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MasterItem {
  id: string;
  name: string;
}

interface MasterListManagerProps {
  tableName: string;
  queryKey: string;
  title: string;
  itemName: string;
}

const MasterListManager = ({ tableName, queryKey, title, itemName }: MasterListManagerProps) => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterItem | null>(null);
  const [itemNameInput, setItemNameInput] = useState("");

  const { data: items = [], isLoading } = useQuery<MasterItem[]>({
    queryKey: [queryKey],
    queryFn: async () => {
      const { data, error } = await supabase.from(tableName).select('*').order('name', { ascending: true });
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (item: Partial<MasterItem>) => {
      const { error } = await supabase.from(tableName).upsert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      showSuccess(`${editingItem ? 'Cập nhật' : 'Thêm'} ${itemName.toLowerCase()} thành công!`);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => showError(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      showSuccess(`Đã xóa ${itemName.toLowerCase()}.`);
    },
    onError: (error: Error) => showError(error.message),
  });

  const handleOpenDialog = (item: MasterItem | null) => {
    setEditingItem(item);
    setItemNameInput(item ? item.name : "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!itemNameInput.trim()) {
      showError(`Tên ${itemName.toLowerCase()} không được để trống.`);
      return;
    }
    mutation.mutate({ id: editingItem?.id, name: itemNameInput.trim() });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        <Button onClick={() => handleOpenDialog(null)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm {itemName}
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên {itemName}</TableHead>
                <TableHead className="text-right">Tác vụ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    Chưa có {itemName.toLowerCase()} nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Sửa' : 'Thêm'} {itemName}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="item-name">Tên {itemName}</Label>
            <Input
              id="item-name"
              value={itemNameInput}
              onChange={(e) => setItemNameInput(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterListManager;
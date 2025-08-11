import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Service } from "@/types/service-sales";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Edit, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface ServiceSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServiceSettingsDialog = ({ open, onOpenChange }: ServiceSettingsDialogProps) => {
  const queryClient = useQueryClient();
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [statuses, setStatuses] = useState("");
  const [allowFreeTrial, setAllowFreeTrial] = useState(false);

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ['services'],
    queryFn: async () => {
      const { data, error } = await supabase.from('services').select('*').order('created_at');
      if (error) throw error;
      return data || [];
    }
  });

  const mutation = useMutation({
    mutationFn: async (service: Partial<Service>) => {
      const { error } = await supabase.from('services').upsert(service);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showSuccess("Lưu dịch vụ thành công!");
      setEditingService(null);
    },
    onError: (err: Error) => showError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      showSuccess("Xóa dịch vụ thành công!");
    },
    onError: (err: Error) => showError(err.message),
  });

  useEffect(() => {
    if (editingService) {
      setName(editingService.name || "");
      setPrice(editingService.price || 0);
      setStatuses((editingService.statuses || []).join('\n'));
      setAllowFreeTrial(editingService.allow_free_trial || false);
    } else {
      setName("");
      setPrice(0);
      setStatuses("");
      setAllowFreeTrial(false);
    }
  }, [editingService]);

  const handleSave = () => {
    const statusArray = statuses.split('\n').map(s => s.trim()).filter(Boolean);
    mutation.mutate({
      id: editingService?.id,
      name,
      price,
      statuses: statusArray,
      allow_free_trial: allowFreeTrial,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cấu hình Dịch vụ</DialogTitle>
          <DialogDescription>Thêm, sửa, xóa các dịch vụ có thể bán.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <h3 className="font-semibold">{editingService ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}</h3>
            <div className="space-y-2">
              <Label htmlFor="service-name">Tên dịch vụ</Label>
              <Input id="service-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-price">Giá tiền (đ)</Label>
              <Input id="service-price" type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-statuses">Các trạng thái (mỗi trạng thái một dòng)</Label>
              <Textarea id="service-statuses" value={statuses} onChange={(e) => setStatuses(e.target.value)} placeholder="Chưa thực hiện&#10;Đang thực hiện&#10;Hoàn thành" />
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="allow-free-trial" checked={allowFreeTrial} onCheckedChange={setAllowFreeTrial} />
              <Label htmlFor="allow-free-trial">Cho phép trải nghiệm free</Label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={mutation.isPending}>Lưu</Button>
              {editingService && <Button variant="outline" onClick={() => setEditingService(null)}>Hủy</Button>}
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Danh sách dịch vụ</h3>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
              {services.map(service => (
                <div key={service.id} className="flex justify-between items-center p-2 border rounded-md">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-green-600">{formatCurrency(service.price)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingService(service)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(service.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
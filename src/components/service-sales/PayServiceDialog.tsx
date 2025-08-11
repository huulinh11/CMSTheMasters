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
import { Label } from "@/components/ui/label";
import { GuestService } from "@/types/service-sales";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { formatCurrency } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

interface PayServiceDialogProps {
  item: GuestService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PayServiceDialog = ({ item, open, onOpenChange }: PayServiceDialogProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [formattedAmount, setFormattedAmount] = useState("0");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (item) {
      setAmount(item.unpaid_amount);
      setFormattedAmount(new Intl.NumberFormat('vi-VN').format(item.unpaid_amount));
      setBillFile(null);
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: async (paymentAmount: number) => {
      if (!item) throw new Error("Không có mục nào được chọn");
      if (paymentAmount <= 0) throw new Error("Số tiền phải lớn hơn 0");
      if (paymentAmount > item.unpaid_amount) throw new Error("Số tiền thanh toán không thể lớn hơn số tiền chưa thanh toán");
      
      let billImageUrl: string | null = null;
      if (billFile) {
        setIsUploading(true);
        const fileExt = billFile.name.split('.').pop();
        const fileName = `${item.guest_id}-service-${uuidv4()}.${fileExt}`;
        const filePath = `public/bills/${fileName}`;

        const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, billFile);
        if (uploadError) throw new Error(`Lỗi tải bill lên: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        billImageUrl = publicUrl;
      }

      const { error } = await supabase
        .from("service_payments")
        .insert({ 
          guest_service_id: item.id, 
          amount: paymentAmount,
          bill_image_url: billImageUrl,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_service_details"] });
      showSuccess("Thanh toán thành công!");
      onOpenChange(false);
    },
    onError: (error: Error) => showError(`Lỗi: ${error.message}`),
    onSettled: () => setIsUploading(false),
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setAmount(numericValue);
    setFormattedAmount(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thanh toán cho {item.guest_name}</DialogTitle>
          <DialogDescription>Dịch vụ: {item.service_name} - Chưa thanh toán: {formatCurrency(item.unpaid_amount)}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="payment">Số tiền thanh toán (đ)</Label>
            <Input id="payment" type="text" value={formattedAmount} onChange={handleAmountChange} />
          </div>
          <div>
            <Label htmlFor="bill-upload">Bill thanh toán (tùy chọn)</Label>
            <Input id="bill-upload" type="file" accept="image/*" onChange={(e) => setBillFile(e.target.files?.[0] || null)} disabled={isUploading} />
            {billFile && <p className="text-sm text-muted-foreground mt-1">Đã chọn: {billFile.name}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => mutation.mutate(amount)} disabled={mutation.isPending || isUploading}>
            {isUploading ? 'Đang tải bill...' : (mutation.isPending ? "Đang xử lý..." : "Xác nhận")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import { useState, useEffect } from "react";
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

interface PayServiceDialogProps {
  item: GuestService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PayServiceDialog = ({ item, open, onOpenChange }: PayServiceDialogProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [formattedAmount, setFormattedAmount] = useState("0");

  useEffect(() => {
    if (item) {
      setAmount(item.unpaid_amount);
      setFormattedAmount(new Intl.NumberFormat('vi-VN').format(item.unpaid_amount));
    }
  }, [item]);

  const mutation = useMutation({
    mutationFn: async (paymentAmount: number) => {
      if (!item) throw new Error("Không có mục nào được chọn");
      if (paymentAmount <= 0) throw new Error("Số tiền phải lớn hơn 0");
      if (paymentAmount > item.unpaid_amount) throw new Error("Số tiền thanh toán không thể lớn hơn số tiền chưa thanh toán");
      
      const newPaidAmount = item.paid_amount + paymentAmount;
      const { error } = await supabase
        .from("guest_services")
        .update({ paid_amount: newPaidAmount })
        .eq('id', item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_service_details"] });
      showSuccess("Thanh toán thành công!");
      onOpenChange(false);
    },
    onError: (error: Error) => showError(`Lỗi: ${error.message}`),
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
        <div className="py-4">
          <Label htmlFor="payment">Số tiền thanh toán (đ)</Label>
          <Input
            id="payment"
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => mutation.mutate(amount)} disabled={mutation.isPending}>Xác nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
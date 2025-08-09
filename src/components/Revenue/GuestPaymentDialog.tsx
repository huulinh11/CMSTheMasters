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
import { GuestRevenue } from "@/types/guest-revenue";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { formatCurrency } from "@/lib/utils";

interface GuestPaymentDialogProps {
  guest: GuestRevenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GuestPaymentDialog = ({ guest, open, onOpenChange }: GuestPaymentDialogProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [formattedAmount, setFormattedAmount] = useState("0");

  useEffect(() => {
    if (guest) {
      const unpaidAmount = guest.unpaid > 0 ? guest.unpaid : 0;
      setAmount(unpaidAmount);
      setFormattedAmount(new Intl.NumberFormat('vi-VN').format(unpaidAmount));
    }
  }, [guest]);

  const mutation = useMutation({
    mutationFn: async (paymentAmount: number) => {
      if (!guest) throw new Error("Không có khách nào được chọn");
      if (paymentAmount <= 0) throw new Error("Số tiền phải lớn hơn 0");
      if (paymentAmount > guest.unpaid) throw new Error("Số tiền thanh toán không thể lớn hơn số tiền chưa thanh toán");
      
      const { error } = await supabase
        .from("guest_payments")
        .insert({ guest_id: guest.id, amount: paymentAmount });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_revenue"] });
      showSuccess("Thanh toán thành công!");
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
    onSettled: () => {
      onOpenChange(false);
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setAmount(numericValue);
    setFormattedAmount(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  const handleSubmit = () => {
    mutation.mutate(amount);
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thanh toán cho {guest.name}</DialogTitle>
          <DialogDescription>
            Chưa thanh toán: {formatCurrency(guest.unpaid)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="payment">Số tiền thanh toán (đ)</Label>
          <Input
            id="payment"
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
          />
           <Button size="sm" variant="link" className="p-0 h-auto mt-2" onClick={() => {
             const unpaidAmount = guest.unpaid > 0 ? guest.unpaid : 0;
             setAmount(unpaidAmount);
             setFormattedAmount(new Intl.NumberFormat('vi-VN').format(unpaidAmount));
           }}>
            Thanh toán hết
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang xử lý..." : "Xác nhận"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuestPaymentDialog;
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
import { VipGuestRevenue } from "@/types/vip-guest-revenue";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { formatCurrency } from "@/lib/utils";

interface EditSponsorshipDialogProps {
  guest: VipGuestRevenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditSponsorshipDialog = ({ guest, open, onOpenChange }: EditSponsorshipDialogProps) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(0);
  const [formattedAmount, setFormattedAmount] = useState("0");

  useEffect(() => {
    if (guest) {
      setAmount(guest.sponsorship);
      setFormattedAmount(new Intl.NumberFormat('vi-VN').format(guest.sponsorship));
    }
  }, [guest]);

  const mutation = useMutation({
    mutationFn: async (newAmount: number) => {
      if (!guest) throw new Error("Không có khách nào được chọn");
      const { error } = await supabase
        .from("vip_guest_revenue")
        .upsert({ guest_id: guest.id, sponsorship: newAmount }, { onConflict: 'guest_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vip_revenue"] });
      showSuccess("Cập nhật tiền tài trợ thành công!");
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
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
          <DialogTitle>Sửa tiền tài trợ cho {guest.name}</DialogTitle>
          <DialogDescription>
            Số tiền đã thanh toán: {formatCurrency(guest.paid)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="sponsorship">Số tiền tài trợ (đ)</Label>
          <Input
            id="sponsorship"
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
            placeholder="Nhập số tiền"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSponsorshipDialog;
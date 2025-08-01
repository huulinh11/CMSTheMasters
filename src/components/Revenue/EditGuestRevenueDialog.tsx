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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { GuestRevenue, PAYMENT_SOURCES, PaymentSource } from "@/types/guest-revenue";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface EditGuestRevenueDialogProps {
  guest: GuestRevenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "edit" | "upsale";
}

const EditGuestRevenueDialog = ({ guest, open, onOpenChange, mode = "edit" }: EditGuestRevenueDialogProps) => {
  const queryClient = useQueryClient();
  const [sponsorship, setSponsorship] = useState(0);
  const [formattedSponsorship, setFormattedSponsorship] = useState("0");
  const [paymentSource, setPaymentSource] = useState<PaymentSource | "">("");
  const [isUpsaled, setIsUpsaled] = useState(false);

  useEffect(() => {
    if (guest) {
      const initialSponsorship = guest.original_sponsorship || guest.sponsorship;
      setSponsorship(initialSponsorship);
      setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(initialSponsorship));
      setPaymentSource(guest.payment_source || "");
      setIsUpsaled(mode === 'upsale' || guest.is_upsaled);
    }
  }, [guest, open, mode]);

  const mutation = useMutation({
    mutationFn: async (values: { sponsorship: number; payment_source: string; is_upsaled: boolean }) => {
      if (!guest) throw new Error("Không có khách nào được chọn");
      const { error } = await supabase
        .from("guest_revenue")
        .upsert({ 
          guest_id: guest.id, 
          sponsorship: values.sponsorship,
          payment_source: values.payment_source || null,
          is_upsaled: values.is_upsaled,
        }, { onConflict: 'guest_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_revenue"] });
      showSuccess("Cập nhật thông tin thành công!");
      onOpenChange(false);
    },
    onError: (error) => {
      showError(`Lỗi: ${error.message}`);
    },
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setSponsorship(numericValue);
    setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  const handleSubmit = () => {
    mutation.mutate({ sponsorship, payment_source: paymentSource, is_upsaled: isUpsaled });
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'upsale' ? 'Upsale cho' : 'Sửa tài trợ cho'} {guest.name}</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin tài trợ và các chi tiết liên quan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label htmlFor="sponsorship">Số tiền tài trợ (đ)</Label>
            <Input
              id="sponsorship"
              type="text"
              value={formattedSponsorship}
              onChange={handleAmountChange}
              placeholder="Nhập số tiền"
            />
          </div>
          <div>
            <Label htmlFor="payment-source">Nguồn thanh toán</Label>
            <Select value={paymentSource} onValueChange={(value) => setPaymentSource(value as PaymentSource)}>
              <SelectTrigger id="payment-source">
                <SelectValue placeholder="Chọn nguồn" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_SOURCES.map(source => (
                  <SelectItem key={source} value={source}>{source}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="is-upsaled" checked={isUpsaled} onCheckedChange={setIsUpsaled} />
            <Label htmlFor="is-upsaled">Đánh dấu là Upsale</Label>
          </div>
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

export default EditGuestRevenueDialog;
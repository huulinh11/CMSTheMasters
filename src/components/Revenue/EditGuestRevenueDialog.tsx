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
import { RoleConfiguration } from "@/types/role-configuration";
import { useState, useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface EditGuestRevenueDialogProps {
  guest: GuestRevenue | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "edit" | "upsale";
  roleConfigs: RoleConfiguration[];
}

const EditGuestRevenueDialog = ({ guest, open, onOpenChange, mode = "edit", roleConfigs }: EditGuestRevenueDialogProps) => {
  const queryClient = useQueryClient();
  const { profile, user } = useAuth();
  const [sponsorship, setSponsorship] = useState(0);
  const [formattedSponsorship, setFormattedSponsorship] = useState("0");
  const [paymentSource, setPaymentSource] = useState<PaymentSource | "">("");
  const [isUpsaled, setIsUpsaled] = useState(false);
  const [newRole, setNewRole] = useState("");

  const upsaleRoleOptions = useMemo(() => {
    if (!guest) return [];
    const currentRoleConfig = roleConfigs.find(rc => rc.name === guest.role);
    const currentSponsorship = currentRoleConfig?.sponsorship_amount || 0;
    return roleConfigs.filter(rc => rc.sponsorship_amount > currentSponsorship);
  }, [guest, roleConfigs]);

  useEffect(() => {
    if (guest && open) {
      const initialSponsorship = guest.original_sponsorship;
      setSponsorship(initialSponsorship);
      setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(initialSponsorship));
      setPaymentSource(guest.payment_source || "");
      setIsUpsaled(mode === 'upsale' || guest.is_upsaled);
      setNewRole(mode === 'upsale' ? "" : guest.role);
    }
  }, [guest, open, mode]);

  useEffect(() => {
    if (mode === 'upsale' && newRole) {
      const selectedRoleConfig = roleConfigs.find(rc => rc.name === newRole);
      if (selectedRoleConfig) {
        const newSponsorship = selectedRoleConfig.sponsorship_amount;
        setSponsorship(newSponsorship);
        setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(newSponsorship));
      }
    }
  }, [newRole, mode, roleConfigs]);

  const editMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["guest_revenue_details"] });
      showSuccess("Cập nhật thông tin thành công!");
      onOpenChange(false);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const upsaleMutation = useMutation({
    mutationFn: async (values: { newRole: string; sponsorship: number; paymentSource: string; upsaledBy: string }) => {
      if (!guest) throw new Error("Không có khách nào được chọn");
      const { error } = await supabase.rpc('upsale_guest', {
        guest_id_in: guest.id,
        new_role_in: values.newRole,
        new_sponsorship_in: values.sponsorship,
        new_payment_source_in: values.paymentSource,
        upsaled_by_in: values.upsaledBy,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guest_revenue_details"] });
      queryClient.invalidateQueries({ queryKey: ["guests"] });
      queryClient.invalidateQueries({ queryKey: ["guest_upsale_history"] });
      showSuccess("Upsale thành công!");
      onOpenChange(false);
    },
    onError: (error) => showError(`Lỗi: ${error.message}`),
  });

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setSponsorship(numericValue);
    setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  const handleSubmit = () => {
    if (mode === 'upsale') {
      if (!newRole) {
        showError("Vui lòng chọn vai trò mới để upsale.");
        return;
      }
      const upsaledBy = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Unknown User';
      upsaleMutation.mutate({ newRole, sponsorship, paymentSource: paymentSource || "Trống", upsaledBy });
    } else {
      editMutation.mutate({ sponsorship, payment_source: paymentSource, is_upsaled: isUpsaled });
    }
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
          {mode === 'upsale' && (
            <>
              <div>
                <Label htmlFor="new-role">Vai trò mới</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger id="new-role">
                    <SelectValue placeholder="Chọn vai trò để upsale" />
                  </SelectTrigger>
                  <SelectContent>
                    {upsaleRoleOptions.map(role => (
                      <SelectItem key={role.id} value={role.name}>{role.name} ({formatCurrency(role.sponsorship_amount)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
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
            <Switch id="is-upsaled" checked={isUpsaled} onCheckedChange={setIsUpsaled} disabled={mode === 'upsale'} />
            <Label htmlFor="is-upsaled">Đánh dấu là Upsale</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={editMutation.isPending || upsaleMutation.isPending}>
            {editMutation.isPending || upsaleMutation.isPending ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditGuestRevenueDialog;
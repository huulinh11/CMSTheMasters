import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { GuestService } from "@/types/service-sales";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { AppUser } from "@/types/app-user";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

type Referrer = ((Guest | VipGuest) | (AppUser & { type: 'sale' })) & { name: string, type: 'guest' | 'sale' };

interface EditGuestServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: GuestService | null;
}

export const EditGuestServiceDialog = ({ open, onOpenChange, service }: EditGuestServiceDialogProps) => {
  const queryClient = useQueryClient();

  const [price, setPrice] = useState(0);
  const [formattedPrice, setFormattedPrice] = useState("0");
  const [paidAmount, setPaidAmount] = useState(0);
  const [formattedPaidAmount, setFormattedPaidAmount] = useState("0");
  const [selectedReferrerId, setSelectedReferrerId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [isReferrerPopoverOpen, setIsReferrerPopoverOpen] = useState(false);

  const { data: guests = [] } = useQuery<(Guest | VipGuest)[]>({
    queryKey: ['all_guests_for_service'],
    queryFn: async () => {
      const { data: vips } = await supabase.from('vip_guests').select('*');
      const { data: regulars } = await supabase.from('guests').select('*');
      return [...(vips || []), ...(regulars || [])];
    }
  });
  const { data: sales = [] } = useQuery<AppUser[]>({
    queryKey: ['sales_users'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, role, department').eq('role', 'Sale');
      return (data || []).map(u => ({ ...u, username: u.full_name || '', department: u.department || '' }));
    }
  });

  const referrers = useMemo((): Referrer[] => {
    const guestReferrers: Referrer[] = guests.map(g => ({ ...g, type: 'guest', name: g.name }));
    const saleReferrers: Referrer[] = sales.map(s => ({ ...s, type: 'sale', name: s.full_name }));
    return [...guestReferrers, ...saleReferrers];
  }, [guests, sales]);

  useEffect(() => {
    if (service && open) {
      setPrice(service.price);
      setFormattedPrice(new Intl.NumberFormat('vi-VN').format(service.price));
      setPaidAmount(service.paid_amount);
      setFormattedPaidAmount(new Intl.NumberFormat('vi-VN').format(service.paid_amount));
      setSelectedReferrerId(service.referrer_id || "");
      setNotes(service.notes || "");
    }
  }, [service, open]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!service) throw new Error("Dịch vụ không hợp lệ.");
      const referrer = referrers.find(r => r.id === selectedReferrerId);
      const { error } = await supabase.from('guest_services').update({
        price: price,
        paid_amount: paidAmount,
        referrer_id: referrer?.id || null,
        referrer_type: referrer?.type || null,
        notes: notes || null,
      }).eq('id', service.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_service_details'] });
      if (service) {
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'vip', service.guest_id] });
        queryClient.invalidateQueries({ queryKey: ['guest_details', 'regular', service.guest_id] });
      }
      showSuccess("Cập nhật dịch vụ thành công!");
      onOpenChange(false);
    },
    onError: (err: Error) => showError(err.message),
  });

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setPrice(numericValue);
    setFormattedPrice(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  const handlePaidAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setPaidAmount(numericValue);
    setFormattedPaidAmount(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sửa Dịch vụ cho {service.guest_name}</DialogTitle>
          <DialogDescription>{service.service_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Người giới thiệu (tùy chọn)</Label>
            <Popover open={isReferrerPopoverOpen} onOpenChange={setIsReferrerPopoverOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between">{selectedReferrerId ? referrers.find(r => r.id === selectedReferrerId)?.name : "Chọn người giới thiệu..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent side="bottom" align="start" className="w-[--radix-popover-trigger-width] p-0" avoidCollisions={false}><Command><CommandInput placeholder="Tìm người giới thiệu..." /><CommandList onWheel={(e) => e.stopPropagation()}><CommandEmpty>Không tìm thấy.</CommandEmpty><CommandGroup heading="Nhân viên Sale">{sales.map(s => (<CommandItem value={s.full_name} key={s.id} onSelect={() => { setSelectedReferrerId(s.id); setIsReferrerPopoverOpen(false); }}><Check className={cn("mr-2 h-4 w-4", s.id === selectedReferrerId ? "opacity-100" : "opacity-0")} />{s.full_name}</CommandItem>))}</CommandGroup><CommandGroup heading="Khách mời">{guests.map(g => (<CommandItem value={g.name} key={g.id} onSelect={() => { setSelectedReferrerId(g.id); setIsReferrerPopoverOpen(false); }}><Check className={cn("mr-2 h-4 w-4", g.id === selectedReferrerId ? "opacity-100" : "opacity-0")} />{g.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
          </div>
          <div className="space-y-2">
            <Label>Giá dịch vụ (Số tiền tài trợ)</Label>
            <Input type="text" value={formattedPrice} onChange={handlePriceChange} />
          </div>
          <div className="space-y-2">
            <Label>Số tiền đã thanh toán</Label>
            <Input type="text" value={formattedPaidAmount} onChange={handlePaidAmountChange} />
          </div>
          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Thêm ghi chú..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
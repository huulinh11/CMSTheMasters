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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Service } from "@/types/service-sales";
import { Guest } from "@/types/guest";
import { VipGuest } from "@/types/vip-guest";
import { AppUser } from "@/types/app-user";
import { Input } from "../ui/input";
import { useAuth } from "@/contexts/AuthContext";

type CombinedGuest = (Guest | VipGuest) & { type: 'guest' };
type Referrer = (CombinedGuest | (AppUser & { type: 'sale' })) & { name: string };

interface AddGuestServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddGuestServiceDialog = ({ open, onOpenChange }: AddGuestServiceDialogProps) => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const isSale = profile?.role === 'Sale';

  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [selectedReferrerId, setSelectedReferrerId] = useState<string>("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [formattedPaidAmount, setFormattedPaidAmount] = useState("0");
  const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);
  const [isReferrerPopoverOpen, setIsReferrerPopoverOpen] = useState(false);

  const { data: services = [] } = useQuery<Service[]>({ queryKey: ['services'] });
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

  const selectedService = services.find(s => s.id === selectedServiceId);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedGuestId || !selectedServiceId) throw new Error("Vui lòng chọn khách mời và dịch vụ.");
      const referrer = referrers.find(r => r.id === selectedReferrerId);
      const { error } = await supabase.from('guest_services').insert({
        guest_id: selectedGuestId,
        service_id: selectedServiceId,
        price: selectedService?.price || 0,
        paid_amount: paidAmount,
        referrer_id: referrer?.id || null,
        referrer_type: referrer?.type || null,
        status: selectedService?.statuses?.[0] || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guest_service_details'] });
      showSuccess("Thêm dịch vụ thành công!");
      onOpenChange(false);
    },
    onError: (err: Error) => showError(err.message),
  });

  useEffect(() => {
    if (!open) {
      setSelectedGuestId("");
      setSelectedServiceId("");
      setSelectedReferrerId("");
      setPaidAmount(0);
      setFormattedPaidAmount("0");
    } else if (isSale && profile) {
      setSelectedReferrerId(profile.id);
    }
  }, [open, isSale, profile]);

  useEffect(() => {
    if (selectedService) {
      setPaidAmount(selectedService.price);
      setFormattedPaidAmount(new Intl.NumberFormat('vi-VN').format(selectedService.price));
    }
  }, [selectedService]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setPaidAmount(numericValue);
    setFormattedPaidAmount(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm Dịch vụ cho Khách</DialogTitle>
          <DialogDescription>Chọn khách mời, dịch vụ và người giới thiệu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Khách mời</Label>
            <Popover open={isGuestPopoverOpen} onOpenChange={setIsGuestPopoverOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between">{selectedGuestId ? guests.find(g => g.id === selectedGuestId)?.name : "Chọn khách mời..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Tìm khách..." /><CommandList><CommandEmpty>Không tìm thấy.</CommandEmpty><CommandGroup>{guests.map(guest => (<CommandItem value={guest.name} key={guest.id} onSelect={() => { setSelectedGuestId(guest.id); setIsGuestPopoverOpen(false); }}><Check className={cn("mr-2 h-4 w-4", guest.id === selectedGuestId ? "opacity-100" : "opacity-0")} />{guest.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
          </div>
          <div className="space-y-2">
            <Label>Dịch vụ</Label>
            <Select value={selectedServiceId} onValueChange={setSelectedServiceId}><SelectTrigger><SelectValue placeholder="Chọn dịch vụ" /></SelectTrigger><SelectContent>{services.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - {s.price.toLocaleString()}đ</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-2">
            <Label>Người giới thiệu (tùy chọn)</Label>
            <Popover open={isReferrerPopoverOpen} onOpenChange={setIsReferrerPopoverOpen}><PopoverTrigger asChild><Button variant="outline" role="combobox" className="w-full justify-between" disabled={isSale}>{selectedReferrerId ? referrers.find(r => r.id === selectedReferrerId)?.name : "Chọn người giới thiệu..."}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Tìm người giới thiệu..." /><CommandList><CommandEmpty>Không tìm thấy.</CommandEmpty><CommandGroup heading="Nhân viên Sale">{sales.map(s => (<CommandItem value={s.full_name} key={s.id} onSelect={() => { setSelectedReferrerId(s.id); setIsReferrerPopoverOpen(false); }}><Check className={cn("mr-2 h-4 w-4", s.id === selectedReferrerId ? "opacity-100" : "opacity-0")} />{s.full_name}</CommandItem>))}</CommandGroup><CommandGroup heading="Khách mời">{guests.map(g => (<CommandItem value={g.name} key={g.id} onSelect={() => { setSelectedReferrerId(g.id); setIsReferrerPopoverOpen(false); }}><Check className={cn("mr-2 h-4 w-4", g.id === selectedReferrerId ? "opacity-100" : "opacity-0")} />{g.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover>
          </div>
          <div className="space-y-2">
            <Label>Số tiền đã thanh toán</Label>
            <Input type="text" value={formattedPaidAmount} onChange={handleAmountChange} />
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
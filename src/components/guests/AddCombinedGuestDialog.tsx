import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm, FormProvider, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { GuestFormValues, guestFormSchema } from "@/types/guest";
import { VipGuestFormValues, vipGuestFormSchema } from "@/types/vip-guest";
import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { VipGuest } from "@/types/vip-guest";
import { RoleConfiguration } from "@/types/role-configuration";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PAYMENT_SOURCES } from "@/types/guest-revenue";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// --- VIP Guest Form ---
const VipGuestForm = ({ form, onSubmit, allGuests, roleConfigs }: { form: UseFormReturn<VipGuestFormValues>, onSubmit: (values: VipGuestFormValues) => void, allGuests: VipGuest[], roleConfigs: RoleConfiguration[] }) => {
  const { watch, setValue, getValues } = form;
  const sponsorshipAmount = watch("sponsorship_amount");
  const paidAmount = watch("paid_amount");

  const [sponsorshipInput, setSponsorshipInput] = useState("0");
  const [paidInput, setPaidInput] = useState("0");

  useEffect(() => {
    setSponsorshipInput(new Intl.NumberFormat('vi-VN').format(sponsorshipAmount || 0));
  }, [sponsorshipAmount]);

  useEffect(() => {
    setPaidInput(new Intl.NumberFormat('vi-VN').format(paidAmount || 0));
  }, [paidAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: "sponsorship_amount" | "paid_amount", setter: React.Dispatch<React.SetStateAction<string>>) => {
    const rawValue = e.target.value;
    setter(rawValue);
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue(field, numericValue, { shouldDirty: true });

    if (field === 'sponsorship_amount') {
        const currentPaid = getValues("paid_amount") || 0;
        if (currentPaid > numericValue) {
            setValue("paid_amount", numericValue, { shouldDirty: true });
        }
    }
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>, field: "sponsorship_amount" | "paid_amount") => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue(field, numericValue, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form id="vip-guest-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên</FormLabel><FormControl><Input placeholder="Nhập tên khách mời" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="Nhập số điện thoại" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Vai trò</FormLabel><Select onValueChange={(value) => { field.onChange(value); const roleConfig = roleConfigs.find(rc => rc.name === value); if (roleConfig) { const newAmount = roleConfig.sponsorship_amount; setValue("sponsorship_amount", newAmount); setValue("paid_amount", 0); } }} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger></FormControl><SelectContent>{roleConfigs.map((role) => (<SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="secondaryInfo" render={({ field }) => (<FormItem><FormLabel>Thông tin phụ</FormLabel><FormControl><Input placeholder="Nhập thông tin phụ" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="sponsorship_amount" render={() => (<FormItem><FormLabel>Số tiền tài trợ (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={sponsorshipInput} onChange={(e) => handleAmountChange(e, "sponsorship_amount", setSponsorshipInput)} onBlur={(e) => handleAmountBlur(e, "sponsorship_amount")} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="paid_amount" render={() => (<FormItem><FormLabel>Số tiền đã thanh toán (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={paidInput} onChange={(e) => handleAmountChange(e, "paid_amount", setPaidInput)} onBlur={(e) => handleAmountBlur(e, "paid_amount")} /></FormControl><Button type="button" size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => { const amount = sponsorshipAmount || 0; setValue("paid_amount", amount); }}>Thanh toán đủ</Button><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="referrer" render={({ field }) => { const displayValue = field.value ? (field.value === 'ads' ? 'Ads' : allGuests.find((guest) => guest.id === field.value)?.name) : "Chọn người giới thiệu"; return (<FormItem className="flex flex-col"><FormLabel>Người giới thiệu</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{displayValue}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Tìm kiếm khách..." /><CommandList><CommandEmpty>Không tìm thấy khách.</CommandEmpty><CommandGroup><CommandItem value="" onSelect={() => { form.setValue("referrer", ""); }}><Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />(Không có)</CommandItem><CommandItem value="Ads" onSelect={() => { form.setValue("referrer", "ads"); }}><Check className={cn("mr-2 h-4 w-4", field.value === 'ads' ? "opacity-100" : "opacity-0")} />Ads</CommandItem>{allGuests.map((guest) => (<CommandItem value={guest.name} key={guest.id} onSelect={() => { form.setValue("referrer", guest.id); }}><Check className={cn("mr-2 h-4 w-4", guest.id === field.value ? "opacity-100" : "opacity-0")} />{guest.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>);}} />
        </div>
        <FormField control={form.control} name="materials" render={({ field }) => (<FormItem><FormLabel>Tư liệu</FormLabel><FormControl><Textarea placeholder="Nhập tư liệu" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Textarea placeholder="Nhập ghi chú" {...field} /></FormControl><FormMessage /></FormItem>)} />
      </form>
    </FormProvider>
  );
}

// --- Regular Guest Form ---
const RegularGuestForm = ({ form, onSubmit, allVipGuests, roleConfigs }: { form: UseFormReturn<GuestFormValues>, onSubmit: (values: GuestFormValues) => void, allVipGuests: Pick<VipGuest, 'id' | 'name'>[], roleConfigs: RoleConfiguration[] }) => {
  const { watch, setValue, getValues } = form;
  const sponsorshipAmount = watch("sponsorship_amount");
  const paidAmount = watch("paid_amount");

  const [sponsorshipInput, setSponsorshipInput] = useState("0");
  const [paidInput, setPaidInput] = useState("0");

  useEffect(() => {
    if (sponsorshipAmount !== undefined) {
      setSponsorshipInput(new Intl.NumberFormat('vi-VN').format(sponsorshipAmount));
    }
  }, [sponsorshipAmount]);

  useEffect(() => {
    if (paidAmount !== undefined) {
      setPaidInput(new Intl.NumberFormat('vi-VN').format(paidAmount));
    }
  }, [paidAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: "sponsorship_amount" | "paid_amount", setter: React.Dispatch<React.SetStateAction<string>>) => {
    const rawValue = e.target.value;
    setter(rawValue);
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue(field, numericValue, { shouldDirty: true });

    if (field === 'sponsorship_amount') {
        const currentPaid = getValues("paid_amount") || 0;
        if (currentPaid > numericValue) {
            setValue("paid_amount", numericValue, { shouldDirty: true });
        }
    }
  };

  const handleAmountBlur = (e: React.FocusEvent<HTMLInputElement>, field: "sponsorship_amount" | "paid_amount") => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue(field, numericValue, { shouldDirty: true });
  };

  return (
    <FormProvider {...form}>
      <form id="regular-guest-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên</FormLabel><FormControl><Input placeholder="Nhập tên khách mời" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="Nhập số điện thoại" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Vai trò</FormLabel><Select onValueChange={(value) => { field.onChange(value); const roleConfig = roleConfigs.find(rc => rc.name === value); if (roleConfig) { const newAmount = roleConfig.sponsorship_amount; setValue("sponsorship_amount", newAmount); setValue("paid_amount", 0); } }} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger></FormControl><SelectContent>{roleConfigs.map((role) => (<SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="payment_source" render={({ field }) => (<FormItem><FormLabel>Nguồn thanh toán</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn nguồn" /></SelectTrigger></FormControl><SelectContent>{PAYMENT_SOURCES.map(source => (<SelectItem key={source} value={source}>{source}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="sponsorship_amount" render={() => (<FormItem><FormLabel>Số tiền tài trợ (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={sponsorshipInput} onChange={(e) => handleAmountChange(e, "sponsorship_amount", setSponsorshipInput)} onBlur={(e) => handleAmountBlur(e, "sponsorship_amount")} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="paid_amount" render={() => (<FormItem><FormLabel>Số tiền đã thanh toán (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={paidInput} onChange={(e) => handleAmountChange(e, "paid_amount", setPaidInput)} onBlur={(e) => handleAmountBlur(e, "paid_amount")} /></FormControl><Button type="button" size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => { const amount = sponsorshipAmount || 0; setValue("paid_amount", amount); }}>Thanh toán đủ</Button><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="referrer" render={({ field }) => { const displayValue = field.value ? (field.value === 'ads' ? 'Ads' : allVipGuests.find((guest) => guest.id === field.value)?.name) : "Chọn người giới thiệu"; return (<FormItem className="flex flex-col"><FormLabel>Người giới thiệu</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{displayValue}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-[--radix-popover-trigger-width] p-0"><Command><CommandInput placeholder="Tìm kiếm khách..." /><CommandList><CommandEmpty>Không tìm thấy khách.</CommandEmpty><CommandGroup><CommandItem value="" onSelect={() => { form.setValue("referrer", ""); }}><Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />(Không có)</CommandItem><CommandItem value="Ads" onSelect={() => { form.setValue("referrer", "ads"); }}><Check className={cn("mr-2 h-4 w-4", field.value === 'ads' ? "opacity-100" : "opacity-0")} />Ads</CommandItem>{allVipGuests.map((guest) => (<CommandItem value={guest.name} key={guest.id} onSelect={() => { form.setValue("referrer", guest.id); }}><Check className={cn("mr-2 h-4 w-4", guest.id === field.value ? "opacity-100" : "opacity-0")} />{guest.name}</CommandItem>))}</CommandGroup></CommandList></Command></PopoverContent></Popover><FormMessage /></FormItem>);}} />
        </div>
        <FormField control={form.control} name="materials" render={({ field }) => (<FormItem><FormLabel>Tư liệu</FormLabel><FormControl><Textarea placeholder="Nhập tư liệu" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Textarea placeholder="Nhập ghi chú" {...field} /></FormControl><FormMessage /></FormItem>)} />
      </form>
    </FormProvider>
  );
}

interface AddCombinedGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVipSubmit: (values: VipGuestFormValues) => void;
  onRegularSubmit: (values: GuestFormValues) => void;
  allVipGuests: VipGuest[];
  roleConfigs: RoleConfiguration[];
}

export const AddCombinedGuestDialog = ({ open, onOpenChange, onVipSubmit, onRegularSubmit, allVipGuests, roleConfigs }: AddCombinedGuestDialogProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("vip");

  const vipForm = useForm<VipGuestFormValues>({
    resolver: zodResolver(vipGuestFormSchema),
    defaultValues: {
      name: "", role: undefined, secondaryInfo: "", phone: "", referrer: "", notes: "",
      sponsorship_amount: 0, paid_amount: 0,
    }
  });

  const regularForm = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
    defaultValues: {
      name: "", role: undefined, phone: "", referrer: "", notes: "",
      sponsorship_amount: 0, paid_amount: 0, payment_source: 'Trống'
    }
  });

  useEffect(() => {
    if (open) {
      vipForm.reset({
        name: "", role: undefined, secondaryInfo: "", phone: "", referrer: "", notes: "",
        sponsorship_amount: 0, paid_amount: 0,
      });
      regularForm.reset({
        name: "", role: undefined, phone: "", referrer: "", notes: "",
        sponsorship_amount: 0, paid_amount: 0, payment_source: 'Trống'
      });
    }
  }, [open, vipForm, regularForm]);

  const vipRoleConfigs = roleConfigs.filter(r => r.type === 'Chức vụ');
  const regularRoleConfigs = roleConfigs.filter(r => r.type === 'Khách mời');

  const DialogComponent = isMobile ? Drawer : Dialog;
  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;

  const FormContent = () => (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="vip">Chức vụ</TabsTrigger>
        <TabsTrigger value="regular">Khách mời</TabsTrigger>
      </TabsList>
      <TabsContent value="vip">
        <VipGuestForm form={vipForm} onSubmit={onVipSubmit} allGuests={allVipGuests} roleConfigs={vipRoleConfigs} />
      </TabsContent>
      <TabsContent value="regular">
        <RegularGuestForm form={regularForm} onSubmit={onRegularSubmit} allVipGuests={allVipGuests} roleConfigs={regularRoleConfigs} />
      </TabsContent>
    </Tabs>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0">
            <DrawerTitle>Thêm khách mới</DrawerTitle>
            <DrawerDescription>Chọn loại khách và điền thông tin.</DrawerDescription>
          </DrawerHeader>
          <ScrollArea className="overflow-y-auto flex-grow px-4">
            <FormContent />
          </ScrollArea>
          <DrawerFooter className="pt-2 flex-shrink-0 flex-row gap-2">
            <Button type="submit" form={activeTab === 'vip' ? 'vip-guest-form' : 'regular-guest-form'} className="flex-1">Lưu</Button>
            <DrawerClose asChild><Button variant="outline" className="flex-1">Hủy</Button></DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>Thêm khách mới</DialogTitle>
          <DialogDescription>Chọn loại khách và điền thông tin.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0">
          <div className="px-6">
            <FormContent />
          </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form={activeTab === 'vip' ? 'vip-guest-form' : 'regular-guest-form'}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VipGuest, VipGuestFormValues, vipGuestFormSchema } from "@/types/vip-guest";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { RoleConfiguration } from "@/types/role-configuration";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddVipGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: VipGuestFormValues) => void;
  defaultValues?: (VipGuest & { sponsorship_amount?: number, paid_amount?: number, paid?: number }) | null;
  allGuests: VipGuest[];
  roleConfigs: RoleConfiguration[];
}

const VipGuestForm = ({ className, onSubmit, defaultValues, allGuests, roleConfigs }: { className?: string, onSubmit: (values: VipGuestFormValues) => void, defaultValues?: (VipGuest & { sponsorship_amount?: number, paid_amount?: number, paid?: number }) | null, allGuests: VipGuest[], roleConfigs: RoleConfiguration[] }) => {
  const form = useForm<VipGuestFormValues>({
    resolver: zodResolver(vipGuestFormSchema),
  });

  const { watch, setValue, formState } = form;
  const selectedRole = watch("role");
  const sponsorshipAmount = watch("sponsorship_amount");

  const [formattedSponsorship, setFormattedSponsorship] = useState("0");
  const [formattedPaid, setFormattedPaid] = useState("0");

  useEffect(() => {
    if (selectedRole) {
      const roleConfig = roleConfigs.find(rc => rc.name === selectedRole);
      if (roleConfig) {
        if (!defaultValues || formState.isDirty) {
          const newAmount = roleConfig.sponsorship_amount;
          setValue("sponsorship_amount", newAmount);
          setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(newAmount));
        }
      }
    }
  }, [selectedRole, roleConfigs, setValue, defaultValues, formState.isDirty]);

  useEffect(() => {
    if (defaultValues) {
      const valuesForForm = {
        ...defaultValues,
        sponsorship_amount: (defaultValues as any).sponsorship ?? defaultValues.sponsorship_amount ?? 0,
        paid_amount: (defaultValues as any).paid ?? 0,
      };
      form.reset(valuesForForm);
      setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(valuesForForm.sponsorship_amount));
      setFormattedPaid(new Intl.NumberFormat('vi-VN').format(valuesForForm.paid_amount));
    } else {
      form.reset({
        name: "", role: undefined, secondaryInfo: "", phone: "", referrer: "", notes: "",
        sponsorship_amount: 0, paid_amount: 0,
      });
      setFormattedSponsorship("0");
      setFormattedPaid("0");
    }
  }, [defaultValues, form]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>, field: "sponsorship_amount" | "paid_amount", formatter: React.Dispatch<React.SetStateAction<string>>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue(field, numericValue);
    formatter(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên</FormLabel><FormControl><Input placeholder="Nhập tên khách mời" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="Nhập số điện thoại" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="role" render={({ field }) => (<FormItem><FormLabel>Vai trò</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn vai trò" /></SelectTrigger></FormControl><SelectContent>{roleConfigs.map((role) => (<SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="secondaryInfo" render={({ field }) => (<FormItem><FormLabel>Thông tin phụ</FormLabel><FormControl><Input placeholder="Nhập thông tin phụ" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="sponsorship_amount" render={() => (<FormItem><FormLabel>Số tiền tài trợ (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={formattedSponsorship} onChange={(e) => handleAmountChange(e, "sponsorship_amount", setFormattedSponsorship)} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="paid_amount" render={() => (<FormItem><FormLabel>Số tiền đã thanh toán (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={formattedPaid} onChange={(e) => handleAmountChange(e, "paid_amount", setFormattedPaid)} /></FormControl><Button type="button" size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => { const amount = sponsorshipAmount || 0; setValue("paid_amount", amount); setFormattedPaid(new Intl.NumberFormat('vi-VN').format(amount)); }}>Thanh toán đủ</Button><FormMessage /></FormItem>)} />
          <FormField
            control={form.control}
            name="referrer"
            render={({ field }) => {
              const displayValue = field.value
                ? (field.value === 'ads' ? 'Ads' : allGuests.find((guest) => guest.id === field.value)?.name)
                : "Chọn người giới thiệu";

              return (
                <FormItem className="flex flex-col">
                  <FormLabel>Người giới thiệu</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {displayValue}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Tìm kiếm khách..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy khách.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value=""
                              onSelect={() => { form.setValue("referrer", ""); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", !field.value ? "opacity-100" : "opacity-0")} />
                              (Không có)
                            </CommandItem>
                            <CommandItem
                              value="Ads"
                              onSelect={() => { form.setValue("referrer", "ads"); }}
                            >
                              <Check className={cn("mr-2 h-4 w-4", field.value === 'ads' ? "opacity-100" : "opacity-0")} />
                              Ads
                            </CommandItem>
                            {allGuests.filter(g => g.id !== defaultValues?.id).map((guest) => (
                              <CommandItem
                                value={guest.name}
                                key={guest.id}
                                onSelect={() => { form.setValue("referrer", guest.id); }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", guest.id === field.value ? "opacity-100" : "opacity-0")} />
                                {guest.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>
        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Textarea placeholder="Nhập ghi chú" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full">Lưu</Button>
      </form>
    </Form>
  );
}

export const AddVipGuestDialog = ({ open, onOpenChange, onSubmit, defaultValues, allGuests, roleConfigs }: AddVipGuestDialogProps) => {
  const isMobile = useIsMobile();
  
  const handleFormSubmit = (values: VipGuestFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const title = defaultValues ? "Chỉnh sửa khách" : "Thêm khách mới";
  const description = defaultValues ? "Cập nhật thông tin chi tiết." : "Điền thông tin để thêm khách chức vụ mới.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0"><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader>
          <ScrollArea className="overflow-y-auto flex-grow"><VipGuestForm className="px-4" onSubmit={handleFormSubmit} defaultValues={defaultValues} allGuests={allGuests} roleConfigs={roleConfigs} /></ScrollArea>
          <DrawerFooter className="pt-2 flex-shrink-0"><DrawerClose asChild><Button variant="outline">Hủy</Button></DrawerClose></DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><VipGuestForm onSubmit={handleFormSubmit} defaultValues={defaultValues} allGuests={allGuests} roleConfigs={roleConfigs} /></DialogContent>
    </Dialog>
  );
};
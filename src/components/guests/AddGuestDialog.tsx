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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Guest, GuestFormValues, guestFormSchema } from "@/types/guest";
import { useEffect, useState, useRef } from "react";
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
import { PAYMENT_SOURCES, PaymentSource } from "@/types/guest-revenue";

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GuestFormValues) => void;
  defaultValues?: (Guest & { sponsorship_amount?: number, paid_amount?: number, payment_source?: PaymentSource, paid?: number }) | null;
  allVipGuests: Pick<VipGuest, 'id' | 'name'>[];
  roleConfigs: RoleConfiguration[];
}

const GuestForm = ({ open, onSubmit, defaultValues, allVipGuests, roleConfigs, className }: Omit<AddGuestDialogProps, 'open' | 'onOpenChange'> & { open: boolean, className?: string }) => {
  const form = useForm<GuestFormValues>({
    resolver: zodResolver(guestFormSchema),
  });

  const { watch, setValue, getValues, formState, reset } = form;
  const selectedRole = watch("role");
  const sponsorshipAmount = watch("sponsorship_amount");
  const prevRoleRef = useRef<string | undefined>();
  const wasOpen = useRef(false);

  const [formattedSponsorship, setFormattedSponsorship] = useState("0");
  const [formattedPaid, setFormattedPaid] = useState("0");

  useEffect(() => {
    if (open && !wasOpen.current) {
      if (defaultValues) {
        const valuesForForm = {
          ...defaultValues,
          sponsorship_amount: (defaultValues as any).sponsorship ?? defaultValues.sponsorship_amount ?? 0,
          paid_amount: (defaultValues as any).paid ?? 0,
        };
        reset(valuesForForm);
        setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(valuesForForm.sponsorship_amount));
        setFormattedPaid(new Intl.NumberFormat('vi-VN').format(valuesForForm.paid_amount));
      } else {
        reset({
          name: "", role: undefined, phone: "", referrer: "", notes: "",
          sponsorship_amount: 0, paid_amount: 0, payment_source: 'Trống'
        });
        setFormattedSponsorship("0");
        setFormattedPaid("0");
      }
    }
    wasOpen.current = open;
  }, [open, defaultValues, reset]);

  useEffect(() => {
    if (selectedRole && selectedRole !== prevRoleRef.current) {
      const roleConfig = roleConfigs.find(rc => rc.name === selectedRole);
      if (roleConfig) {
        if (!formState.isDirty || !defaultValues) {
          const newAmount = roleConfig.sponsorship_amount;
          setValue("sponsorship_amount", newAmount, { shouldDirty: true });
          setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(newAmount));
        }
      }
    }
    prevRoleRef.current = selectedRole;
  }, [selectedRole, roleConfigs, setValue, defaultValues, formState.isDirty]);

  const handleSponsorshipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue("sponsorship_amount", numericValue);
    setFormattedSponsorship(new Intl.NumberFormat('vi-VN').format(numericValue));

    const currentPaid = getValues("paid_amount") || 0;
    if (currentPaid > numericValue) {
        setValue("paid_amount", numericValue);
        setFormattedPaid(new Intl.NumberFormat('vi-VN').format(numericValue));
    }
  };

  const handlePaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    setValue("paid_amount", numericValue);
    setFormattedPaid(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  return (
    <Form {...form}>
      <form id="guest-form" onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-4 gap-y-4">
          <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Tên</FormLabel><FormControl><Input placeholder="Nhập tên khách mời" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Số điện thoại</FormLabel><FormControl><Input placeholder="Nhập số điện thoại" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vai trò</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {roleConfigs.map((role) => (
                      <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField control={form.control} name="payment_source" render={({ field }) => (<FormItem><FormLabel>Nguồn thanh toán</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Chọn nguồn" /></SelectTrigger></FormControl><SelectContent>{PAYMENT_SOURCES.map(source => (<SelectItem key={source} value={source}>{source}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="sponsorship_amount" render={() => (<FormItem><FormLabel>Số tiền tài trợ (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={formattedSponsorship} onChange={handleSponsorshipChange} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="paid_amount" render={() => (<FormItem><FormLabel>Số tiền đã thanh toán (đ)</FormLabel><FormControl><Input placeholder="Nhập số tiền" value={formattedPaid} onChange={handlePaidChange} /></FormControl><Button type="button" size="sm" variant="link" className="p-0 h-auto mt-1" onClick={() => { const amount = sponsorshipAmount || 0; setValue("paid_amount", amount); setFormattedPaid(new Intl.NumberFormat('vi-VN').format(amount)); }}>Thanh toán đủ</Button><FormMessage /></FormItem>)} />
          <FormField
            control={form.control}
            name="referrer"
            render={({ field }) => {
              const displayValue = field.value
                ? (field.value === 'ads' ? 'Ads' : allVipGuests.find((guest) => guest.id === field.value)?.name)
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
                            {allVipGuests.map((guest) => (
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
        <FormField control={form.control} name="materials" render={({ field }) => (<FormItem><FormLabel>Tư liệu</FormLabel><FormControl><Textarea placeholder="Nhập tư liệu" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Ghi chú</FormLabel><FormControl><Textarea placeholder="Nhập ghi chú" {...field} /></FormControl><FormMessage /></FormItem>)} />
        <Button type="submit" className="w-full md:hidden">Lưu</Button>
      </form>
    </Form>
  );
}

export const AddGuestDialog = ({ open, onOpenChange, onSubmit, defaultValues, allVipGuests, roleConfigs }: AddGuestDialogProps) => {
  const isMobile = useIsMobile();

  const handleFormSubmit = (values: GuestFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  const title = defaultValues ? "Chỉnh sửa khách mời" : "Thêm khách mời mới";
  const description = defaultValues ? "Cập nhật thông tin chi tiết." : "Điền thông tin để thêm khách mời mới.";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="text-left flex-shrink-0"><DrawerTitle>{title}</DrawerTitle><DrawerDescription>{description}</DrawerDescription></DrawerHeader>
          <ScrollArea className="overflow-y-auto flex-grow">
            <GuestForm open={open} key={defaultValues?.id || 'new-guest'} onSubmit={handleFormSubmit} defaultValues={defaultValues} allVipGuests={allVipGuests} roleConfigs={roleConfigs} className="px-4 pb-4" />
          </ScrollArea>
          <DrawerFooter className="pt-2 flex-shrink-0"><DrawerClose asChild><Button variant="outline">Hủy</Button></DrawerClose></DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow min-h-0">
          <div className="px-6">
            <GuestForm open={open} key={defaultValues?.id || 'new-guest'} onSubmit={handleFormSubmit} defaultValues={defaultValues} allVipGuests={allVipGuests} roleConfigs={roleConfigs} />
          </div>
        </ScrollArea>
        <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button type="submit" form="guest-form">Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
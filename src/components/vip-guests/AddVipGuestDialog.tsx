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
} from "@/components/ui/command";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VipGuest, VipGuestFormValues, vipGuestFormSchema, ROLES } from "@/types/vip-guest";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddVipGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: VipGuestFormValues) => void;
  defaultValues?: VipGuest | null;
  allGuests: VipGuest[];
}

const VipGuestForm = ({ className, onSubmit, defaultValues, allGuests }: { className?: string, onSubmit: (values: VipGuestFormValues) => void, defaultValues?: VipGuest | null, allGuests: VipGuest[] }) => {
  const form = useForm<VipGuestFormValues>({
    resolver: zodResolver(vipGuestFormSchema),
    defaultValues: defaultValues || {},
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset(defaultValues);
    } else {
      form.reset({
        name: "",
        role: undefined,
        secondaryInfo: "",
        phone: "",
        referrer: "",
        notes: "",
      });
    }
  }, [defaultValues, form]);

  const referrerOptions = allGuests.filter(g => g.id !== defaultValues?.id);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("space-y-4", className)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên</FormLabel>
              <FormControl>
                <Input placeholder="Nhập tên khách mời" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vai trò</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="Nhập số điện thoại" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="secondaryInfo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thông tin phụ</FormLabel>
              <FormControl>
                <Input placeholder="Nhập thông tin phụ" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="referrer"
          render={({ field }) => (
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
                      {field.value
                        ? referrerOptions.find(
                            (guest) => guest.name === field.value
                          )?.name
                        : "Chọn người giới thiệu"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Tìm kiếm khách..." />
                    <CommandEmpty>Không tìm thấy khách.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value=""
                        onSelect={() => {
                          form.setValue("referrer", "");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !field.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        (Không có)
                      </CommandItem>
                      {referrerOptions.map((guest) => (
                        <CommandItem
                          value={guest.name}
                          key={guest.id}
                          onSelect={() => {
                            form.setValue("referrer", guest.name);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              guest.name === field.value
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          {guest.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ghi chú</FormLabel>
              <FormControl>
                <Textarea placeholder="Nhập ghi chú" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Lưu</Button>
      </form>
    </Form>
  );
}

export const AddVipGuestDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  allGuests,
}: AddVipGuestDialogProps) => {
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
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{description}</DrawerDescription>
          </DrawerHeader>
          <VipGuestForm className="px-4" onSubmit={handleFormSubmit} defaultValues={defaultValues} allGuests={allGuests} />
          <DrawerFooter className="pt-2">
            <DrawerClose asChild>
              <Button variant="outline">Hủy</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <VipGuestForm onSubmit={handleFormSubmit} defaultValues={defaultValues} allGuests={allGuests} />
      </DialogContent>
    </Dialog>
  );
};
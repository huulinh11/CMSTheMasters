import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoleConfigFormValues, roleConfigSchema, ROLE_TYPES, RoleConfiguration } from "@/types/role-configuration";
import { useEffect, useState } from "react";

interface AddEditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RoleConfigFormValues) => void;
  defaultValues?: RoleConfiguration | null;
}

export const AddEditRoleDialog = ({ open, onOpenChange, onSubmit, defaultValues }: AddEditRoleDialogProps) => {
  const form = useForm<RoleConfigFormValues>({
    resolver: zodResolver(roleConfigSchema),
    defaultValues: {
      bg_color: "#EFF6FF",
      text_color: "#1E40AF",
    }
  });

  const [formattedAmount, setFormattedAmount] = useState("0");

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        form.reset(defaultValues);
        setFormattedAmount(new Intl.NumberFormat('vi-VN').format(defaultValues.sponsorship_amount));
      } else {
        form.reset({ name: "", type: undefined, sponsorship_amount: 0, bg_color: "#EFF6FF", text_color: "#1E40AF" });
        setFormattedAmount("0");
      }
    }
  }, [defaultValues, form, open]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseInt(rawValue.replace(/[^0-9]/g, ''), 10) || 0;
    form.setValue("sponsorship_amount", numericValue);
    setFormattedAmount(new Intl.NumberFormat('vi-VN').format(numericValue));
  };

  const handleFormSubmit = (values: RoleConfigFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Chỉnh sửa vai trò" : "Thêm vai trò mới"}</DialogTitle>
          <DialogDescription>
            {defaultValues ? "Cập nhật thông tin chi tiết." : "Điền thông tin để thêm vai trò mới."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên vai trò</FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên vai trò" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại vai trò</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại vai trò" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ROLE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
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
              name="sponsorship_amount"
              render={() => (
                <FormItem>
                  <FormLabel>Số tiền tài trợ (đ)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập số tiền"
                      value={formattedAmount}
                      onChange={handleAmountChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bg_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Màu nền</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} className="p-1 h-10 w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="text_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Màu chữ</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} className="p-1 h-10 w-full" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
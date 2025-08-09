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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { VipGuest } from "@/types/vip-guest";
import { useEffect } from "react";

interface EditInformationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: Partial<VipGuest> & { id: string }) => void;
  guest: VipGuest | null;
}

const formSchema = z.object({
  secondaryInfo: z.string().optional(),
  materials: z.string().optional(),
  facebook_link: z.string().url({ message: "Link Facebook không hợp lệ." }).optional().or(z.literal('')),
  image_url: z.string().url({ message: "Link ảnh không hợp lệ." }).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export const EditInformationDialog = ({ open, onOpenChange, onSubmit, guest }: EditInformationDialogProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (guest) {
      form.reset({
        secondaryInfo: guest.secondaryInfo || "",
        materials: guest.materials || "",
        facebook_link: guest.facebook_link || "",
        image_url: guest.image_url || "",
      });
    }
  }, [guest, form]);

  const handleFormSubmit = (values: FormValues) => {
    if (!guest) return;
    onSubmit({ id: guest.id, ...values });
  };

  if (!guest) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin cho {guest.name}</DialogTitle>
          <DialogDescription>
            Cập nhật các thông tin chi tiết. Nhấn lưu khi hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link ảnh đại diện</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
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
                    <Textarea placeholder="Nhập thông tin phụ" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="materials"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tư liệu</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập nội dung tư liệu" {...field} rows={5} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="facebook_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Facebook</FormLabel>
                  <FormControl>
                    <Input placeholder="https://facebook.com/username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sticky bottom-0 bg-white pt-4 -mx-6 px-6 pb-6 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
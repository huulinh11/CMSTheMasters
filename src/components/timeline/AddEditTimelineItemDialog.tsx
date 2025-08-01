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
import { TimelineEvent, TimelineEventFormValues, timelineEventSchema, ParticipantOption } from "@/types/timeline";
import { useEffect } from "react";
import { ParticipantCombobox } from "./ParticipantCombobox";

interface AddEditTimelineItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: TimelineEventFormValues) => void;
  defaultValues?: TimelineEvent | null;
  participantOptions: ParticipantOption[];
}

export const AddEditTimelineItemDialog = ({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  participantOptions,
}: AddEditTimelineItemDialogProps) => {
  const form = useForm<TimelineEventFormValues>({
    resolver: zodResolver(timelineEventSchema),
  });

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        form.reset({
          ...defaultValues,
          participants: defaultValues.participants || [],
        });
      } else {
        form.reset({
          duration_minutes: 5,
          content: "",
          notes: "",
          participants: [],
        });
      }
    }
  }, [defaultValues, open, form]);

  const handleFormSubmit = (values: TimelineEventFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Chỉnh sửa mốc thời gian" : "Thêm mốc thời gian mới"}</DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết cho mốc thời gian.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời lượng (phút)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ví dụ: 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nội dung</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Nhập nội dung hoạt động" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="participants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hoạt động có mặt bạn</FormLabel>
                  <FormControl>
                    <ParticipantCombobox
                      options={participantOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
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
                    <Textarea placeholder="Nhập ghi chú (nếu có)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
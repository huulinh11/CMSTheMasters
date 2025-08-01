import { z } from "zod";

export const timelineEventSchema = z.object({
  duration_minutes: z.coerce.number().min(1, "Thời lượng phải lớn hơn 0."),
  content: z.string().min(1, "Nội dung không được để trống."),
  notes: z.string().optional(),
  participants: z.array(z.string()).optional(),
});

export type TimelineEventFormValues = z.infer<typeof timelineEventSchema>;

export type TimelineEvent = {
  id: string;
  order: number;
  duration_minutes: number;
  content: string;
  notes?: string | null;
  participants?: string[] | null;
  created_at: string;
};

export type TimelineEventClientState = TimelineEvent & {
  start_time: string;
};

export type ParticipantOption = {
  value: string;
  label: string;
  group: 'Vai trò' | 'Khách chức vụ' | 'Khách mời';
};
import { z } from "zod";

export const imageBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("image"),
  imageUrl: z.string().url({ message: "Link ảnh không hợp lệ." }).or(z.literal('')),
  linkUrl: z.string().url({ message: "Link liên kết không hợp lệ." }).optional().or(z.literal('')),
});

export const videoBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("video"),
  videoUrl: z.string().refine(val => val.length === 0 || val.includes('youtube.com/embed/') || val.includes('youtu.be/'), { message: "Chỉ hỗ trợ link Youtube embed (ví dụ: youtube.com/embed/VIDEO_ID)" }),
});

export const textBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("text"),
  text: z.string(),
  backgroundImageUrl: z.string().url({ message: "Link ảnh nền không hợp lệ." }).optional().or(z.literal('')),
  isGuestName: z.boolean().optional(),
});

export const contentBlockSchema = z.union([
  imageBlockSchema,
  videoBlockSchema,
  textBlockSchema,
]);

export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
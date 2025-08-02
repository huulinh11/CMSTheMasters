import { z } from "zod";

export const imageBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("image"),
  imageUrl: z.string().url({ message: "Link ảnh không hợp lệ." }).or(z.literal('')),
  linkUrl: z.string().url({ message: "Link liên kết không hợp lệ." }).optional().or(z.literal('')),
  imageSourceType: z.enum(['url', 'upload']).optional().default('url'),
});

export const videoBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("video"),
  videoUrl: z.string(), // Lenient validation, will be processed into an embed URL
  aspectWidth: z.coerce.number().optional(),
  aspectHeight: z.coerce.number().optional(),
});

const textItemSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  isGuestName: z.boolean().optional().default(false),
});

export const textBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("text"),
  texts: z.array(textItemSchema).min(1, "Phải có ít nhất một mục text."),
  backgroundImageUrl: z.string().url({ message: "Link ảnh nền không hợp lệ." }).optional().or(z.literal('')),
  imageSourceType: z.enum(['url', 'upload']).optional().default('url'),
});

export const contentBlockSchema = z.union([
  imageBlockSchema,
  videoBlockSchema,
  textBlockSchema,
]);

export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
export type TextItem = z.infer<typeof textItemSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
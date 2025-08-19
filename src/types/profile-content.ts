import { z } from "zod";

export const imageBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("image"),
  imageUrl: z.string().url({ message: "Link ảnh không hợp lệ." }).or(z.literal('')),
  linkUrl: z.string().url({ message: "Link liên kết không hợp lệ." }).optional().or(z.literal('')),
  imageSourceType: z.enum(['url', 'upload']).optional().default('url'),
  width: z.coerce.number().min(0).max(100).optional().default(100),
});

export const videoBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("video"),
  videoUrl: z.string(), // Lenient validation, will be processed into an embed URL
  aspectWidth: z.coerce.number().optional(),
  aspectHeight: z.coerce.number().optional(),
});

export const textItemSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("text"),
  text: z.string(),
  isGuestName: z.boolean().optional().default(false),
  fontSize: z.coerce.number().optional().default(32),
  color: z.string().optional().default('#FFFFFF'),
  fontWeight: z.enum(['normal', 'bold']).optional().default('bold'),
  fontStyle: z.enum(['normal', 'italic']).optional().default('normal'),
  fontFamily: z.string().optional().default('sans-serif'),
  marginTop: z.coerce.number().optional().default(0),
  marginRight: z.coerce.number().optional().default(0),
  marginBottom: z.coerce.number().optional().default(0),
  marginLeft: z.coerce.number().optional().default(0),
});

export const imageItemInTextBlockSchema = z.object({
    id: z.string().uuid(),
    type: z.literal("image"),
    imageUrl: z.string().url({ message: "Link ảnh không hợp lệ." }).or(z.literal('')),
    imageSourceType: z.enum(['url', 'upload']).optional().default('url'),
    width: z.coerce.number().min(0).max(100).optional().default(100),
    marginTop: z.coerce.number().optional().default(10),
    marginRight: z.coerce.number().optional().default(0),
    marginBottom: z.coerce.number().optional().default(0),
    marginLeft: z.coerce.number().optional().default(0),
});

export const textBlockItemSchema = z.union([textItemSchema, imageItemInTextBlockSchema]);

export const textBlockSchema = z.object({
  id: z.string().uuid(),
  type: z.literal("text"),
  items: z.array(textBlockItemSchema),
  backgroundImageUrl: z.string().url({ message: "Link ảnh nền không hợp lệ." }).optional().or(z.literal('')),
  imageSourceType: z.enum(['url', 'upload']).optional().default('url'),
  fixedWidth: z.coerce.number().optional(),
  fixedHeight: z.coerce.number().optional(),
});

export const contentBlockSchema = z.union([
  imageBlockSchema,
  videoBlockSchema,
  textBlockSchema,
]);

export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
export type TextItem = z.infer<typeof textItemSchema>;
export type ImageItemInTextBlock = z.infer<typeof imageItemInTextBlockSchema>;
export type TextBlockItem = z.infer<typeof textBlockItemSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
export type ContentBlock = z.infer<typeof contentBlockSchema>;
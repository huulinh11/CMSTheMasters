ALTER TABLE public.checklist_settings
ADD COLUMN IF NOT EXISTS dresscode_title TEXT DEFAULT 'Trang phục';

ALTER TABLE public.checklist_settings
ADD COLUMN IF NOT EXISTS dresscode_image_config JSONB;
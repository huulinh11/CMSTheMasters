ALTER TABLE public.checklist_settings
ADD COLUMN IF NOT EXISTS loader_config JSONB,
ADD COLUMN IF NOT EXISTS loading_text_config JSONB;
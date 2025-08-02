ALTER TABLE public.checklist_settings DROP COLUMN IF EXISTS logo_url;
ALTER TABLE public.checklist_settings ADD COLUMN IF NOT EXISTS logo_config JSONB;
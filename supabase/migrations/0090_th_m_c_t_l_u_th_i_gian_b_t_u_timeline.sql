ALTER TABLE public.checklist_settings
ADD COLUMN IF NOT EXISTS timeline_start_time TEXT DEFAULT '08:00';

UPDATE public.checklist_settings SET timeline_start_time = '08:00' WHERE timeline_start_time IS NULL;
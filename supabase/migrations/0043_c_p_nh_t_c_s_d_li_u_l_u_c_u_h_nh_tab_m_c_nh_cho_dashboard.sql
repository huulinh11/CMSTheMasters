ALTER TABLE public.checklist_settings
ADD COLUMN IF NOT EXISTS default_dashboard_tab TEXT DEFAULT 'khach-moi';
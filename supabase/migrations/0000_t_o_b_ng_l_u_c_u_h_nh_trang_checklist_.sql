CREATE TABLE public.checklist_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  title_config JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.checklist_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public checklist settings are viewable by everyone."
ON public.checklist_settings FOR SELECT
USING (true);

CREATE POLICY "Allow all access for admin users"
ON public.checklist_settings FOR ALL
USING (true);
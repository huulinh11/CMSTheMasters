-- Create the templates table
CREATE TABLE public.profile_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  content JSONB,
  assigned_role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for the new table
ALTER TABLE public.profile_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for template management (allow all authenticated users)
CREATE POLICY "Allow all access to profile templates" ON public.profile_templates
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Add template_id foreign key to guests table
ALTER TABLE public.guests
ADD COLUMN template_id UUID REFERENCES public.profile_templates(id) ON DELETE SET NULL;

-- Add template_id foreign key to vip_guests table
ALTER TABLE public.vip_guests
ADD COLUMN template_id UUID REFERENCES public.profile_templates(id) ON DELETE SET NULL;
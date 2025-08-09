-- Create tasks table
CREATE TABLE public.event_tasks_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.event_tasks_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to event_tasks_master" ON public.event_tasks_master FOR ALL USING (true);

-- Create benefits table
CREATE TABLE public.media_benefits_master (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.media_benefits_master ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to media_benefits_master" ON public.media_benefits_master FOR ALL USING (true);
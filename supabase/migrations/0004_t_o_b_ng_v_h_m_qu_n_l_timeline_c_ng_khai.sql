-- Create the public_timeline_events table to store the published version of the timeline
CREATE TABLE public.public_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  "order" INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  content TEXT NOT NULL,
  notes TEXT,
  participants JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable Row Level Security on the new table
ALTER TABLE public.public_timeline_events ENABLE ROW LEVEL SECURITY;

-- Allow public read access to the published timeline
CREATE POLICY "Public timeline is viewable by everyone."
ON public.public_timeline_events FOR SELECT
USING (true);

-- Create a function to publish the timeline
-- This function will clear the public timeline and copy the current admin timeline to it.
CREATE OR REPLACE FUNCTION public.publish_timeline()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Use TRUNCATE for efficiency
  TRUNCATE public.public_timeline_events;

  -- Copy the current timeline to the public timeline
  INSERT INTO public.public_timeline_events (id, "order", duration_minutes, content, notes, participants, created_at)
  SELECT id, "order", duration_minutes, content, notes, participants, created_at
  FROM public.timeline_events;
END;
$$;
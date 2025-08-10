-- Create the table to store menu configuration and order
CREATE TABLE public.menu_config (
  item_id TEXT PRIMARY KEY,
  "order" INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menu_config ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users to read, but only admins/managers to modify
CREATE POLICY "Allow authenticated users to read menu config"
ON public.menu_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins and managers to manage menu config"
ON public.menu_config FOR ALL
TO authenticated
USING (get_my_role() = ANY (ARRAY['Admin'::text, 'Quản lý'::text]))
WITH CHECK (get_my_role() = ANY (ARRAY['Admin'::text, 'Quản lý'::text]));
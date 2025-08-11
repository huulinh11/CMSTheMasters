-- Drop the existing primary key
ALTER TABLE public.menu_config DROP CONSTRAINT menu_config_pkey;

-- Add the role column with a default value
ALTER TABLE public.menu_config ADD COLUMN role TEXT NOT NULL DEFAULT 'default';

-- Create a new primary key
ALTER TABLE public.menu_config ADD PRIMARY KEY (item_id, role);
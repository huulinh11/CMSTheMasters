-- Rename the column for clarity
ALTER TABLE public.profile_templates RENAME COLUMN assigned_role TO assigned_roles;

-- Change the column type to an array of text, converting existing data
ALTER TABLE public.profile_templates ALTER COLUMN assigned_roles TYPE TEXT[] USING ARRAY[assigned_roles];
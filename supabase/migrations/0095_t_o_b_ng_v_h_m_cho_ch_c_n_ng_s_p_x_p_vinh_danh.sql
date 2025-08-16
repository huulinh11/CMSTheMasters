-- Create the table to store honor roll categories
CREATE TABLE public.honor_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    honorees JSONB,
    presenters JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.honor_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for access (allowing all authenticated users for now, similar to other settings)
CREATE POLICY "Allow all access to honor_categories"
ON public.honor_categories
FOR ALL
USING (true)
WITH CHECK (true);

-- Create a function to swap presenters between two categories
CREATE OR REPLACE FUNCTION swap_presenters(category_a_id uuid, category_b_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    presenters_a jsonb;
    presenters_b jsonb;
BEGIN
    -- Get presenters from both categories
    SELECT presenters INTO presenters_a FROM public.honor_categories WHERE id = category_a_id;
    SELECT presenters INTO presenters_b FROM public.honor_categories WHERE id = category_b_id;

    -- Swap them
    UPDATE public.honor_categories SET presenters = presenters_b WHERE id = category_a_id;
    UPDATE public.honor_categories SET presenters = presenters_a WHERE id = category_b_id;
END;
$$;
-- Add columns if they don't exist
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS allow_free_trial BOOLEAN DEFAULT false;
ALTER TABLE public.guest_services ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT false;

-- Create service_payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.service_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_service_id UUID NOT NULL REFERENCES public.guest_services(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    bill_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.service_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to service_payments" ON public.service_payments;
CREATE POLICY "Allow all access to service_payments" ON public.service_payments FOR ALL USING (true) WITH CHECK (true);

-- Function and Trigger to update paid_amount
CREATE OR REPLACE FUNCTION public.update_guest_service_paid_amount()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    UPDATE public.guest_services
    SET paid_amount = paid_amount + NEW.amount
    WHERE id = NEW.guest_service_id;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_new_service_payment ON public.service_payments;
CREATE TRIGGER on_new_service_payment
AFTER INSERT ON public.service_payments
FOR EACH ROW EXECUTE FUNCTION public.update_guest_service_paid_amount();

-- RPC to convert a free trial
CREATE OR REPLACE FUNCTION public.convert_free_trial(guest_service_id_in UUID)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    original_price NUMERIC;
BEGIN
    SELECT s.price INTO original_price
    FROM public.services s
    JOIN public.guest_services gs ON s.id = gs.service_id
    WHERE gs.id = guest_service_id_in;

    UPDATE public.guest_services
    SET is_free_trial = false, price = original_price
    WHERE id = guest_service_id_in;
END;
$$;

-- Drop and recreate functions with new return columns
DROP FUNCTION IF EXISTS public.get_guest_service_details();
CREATE OR REPLACE FUNCTION public.get_guest_service_details()
RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone, is_free_trial boolean)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT gs.id, gs.guest_id, COALESCE(g.name, vg.name), COALESCE(g.phone, vg.phone),
           CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END,
           gs.service_id, s.name, gs.price, gs.paid_amount, (gs.price - gs.paid_amount),
           gs.referrer_id, gs.referrer_type, COALESCE(p.full_name, rg.name, rvg.name),
           gs.status, gs.created_at, gs.is_free_trial
    FROM public.guest_services gs
    JOIN public.services s ON gs.service_id = s.id
    LEFT JOIN public.guests g ON gs.guest_id = g.id
    LEFT JOIN public.vip_guests vg ON gs.guest_id = vg.id
    LEFT JOIN public.profiles p ON gs.referrer_type = 'sale' AND gs.referrer_id = p.id::text
    LEFT JOIN public.guests rg ON gs.referrer_type = 'guest' AND gs.referrer_id = rg.id
    LEFT JOIN public.vip_guests rvg ON gs.referrer_type = 'guest' AND gs.referrer_id = rvg.id
    WHERE COALESCE(g.id, vg.id) IS NOT NULL
    ORDER BY gs.created_at DESC;
END;
$$;

DROP FUNCTION IF EXISTS public.get_guest_service_details_by_guest_id(text);
CREATE OR REPLACE FUNCTION public.get_guest_service_details_by_guest_id(guest_id_in text)
RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone, is_free_trial boolean)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT gs.id, gs.guest_id, COALESCE(g.name, vg.name), COALESCE(g.phone, vg.phone),
           CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END,
           gs.service_id, s.name, gs.price, gs.paid_amount, (gs.price - gs.paid_amount),
           gs.referrer_id, gs.referrer_type, COALESCE(p.full_name, rg.name, rvg.name),
           gs.status, gs.created_at, gs.is_free_trial
    FROM public.guest_services gs
    JOIN public.services s ON gs.service_id = s.id
    LEFT JOIN public.guests g ON gs.guest_id = g.id
    LEFT JOIN public.vip_guests vg ON gs.guest_id = vg.id
    LEFT JOIN public.profiles p ON gs.referrer_type = 'sale' AND gs.referrer_id = p.id::text
    LEFT JOIN public.guests rg ON gs.referrer_type = 'guest' AND gs.referrer_id = rg.id
    LEFT JOIN public.vip_guests rvg ON gs.referrer_type = 'guest' AND gs.referrer_id = rvg.id
    WHERE gs.guest_id = guest_id_in
    ORDER BY gs.created_at DESC;
END;
$$;
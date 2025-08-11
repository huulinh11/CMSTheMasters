-- 1. Add allow_free_trial to services table
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS allow_free_trial BOOLEAN DEFAULT false;

-- 2. Add is_free_trial to guest_services table
ALTER TABLE public.guest_services
ADD COLUMN IF NOT EXISTS is_free_trial BOOLEAN DEFAULT false;

-- 3. Create service_payments table to log transactions
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

-- 4. Function and Trigger to update paid_amount in guest_services
CREATE OR REPLACE FUNCTION public.update_guest_service_paid_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
FOR EACH ROW
EXECUTE FUNCTION public.update_guest_service_paid_amount();

-- 5. RPC to convert a free trial to a paid service
CREATE OR REPLACE FUNCTION public.convert_free_trial(guest_service_id_in UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    original_price NUMERIC;
BEGIN
    -- Get the original price from the services table
    SELECT s.price INTO original_price
    FROM public.services s
    JOIN public.guest_services gs ON s.id = gs.service_id
    WHERE gs.id = guest_service_id_in;

    -- Update the guest_services entry
    UPDATE public.guest_services
    SET 
        is_free_trial = false,
        price = original_price
    WHERE id = guest_service_id_in;
END;
$$;
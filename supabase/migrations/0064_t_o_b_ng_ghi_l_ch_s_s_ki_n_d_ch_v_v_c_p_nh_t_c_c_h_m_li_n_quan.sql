-- 1. Create the event log table to track service history
CREATE TABLE IF NOT EXISTS public.guest_service_event_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_service_id UUID NOT NULL REFERENCES public.guest_services(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- e.g., 'created', 'converted_from_trial'
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.guest_service_event_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access to service event log" ON public.guest_service_event_log;
CREATE POLICY "Allow all access to service event log" ON public.guest_service_event_log FOR ALL USING (true) WITH CHECK (true);

-- 2. Create a trigger to automatically log the creation of a new guest service
CREATE OR REPLACE FUNCTION public.log_new_guest_service_event()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.guest_service_event_log (guest_service_id, event_type, details)
    VALUES (
        NEW.id,
        'created',
        jsonb_build_object(
            'price', NEW.price,
            'is_free_trial', NEW.is_free_trial,
            'service_id', NEW.service_id
        )
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_guest_service_created_log_event ON public.guest_services;
CREATE TRIGGER on_guest_service_created_log_event
AFTER INSERT ON public.guest_services
FOR EACH ROW
EXECUTE FUNCTION public.log_new_guest_service_event();

-- 3. Update the convert_free_trial function to log the conversion event
CREATE OR REPLACE FUNCTION public.convert_free_trial(guest_service_id_in UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    original_price NUMERIC;
    current_details JSONB;
BEGIN
    -- Get the original price from the services table
    SELECT s.price INTO original_price
    FROM public.services s
    JOIN public.guest_services gs ON s.id = gs.service_id
    WHERE gs.id = guest_service_id_in;

    -- Get current details for logging
    SELECT jsonb_build_object('price', gs.price, 'is_free_trial', gs.is_free_trial, 'service_id', gs.service_id)
    INTO current_details
    FROM public.guest_services gs
    WHERE gs.id = guest_service_id_in;

    -- Update the guest_services entry
    UPDATE public.guest_services
    SET 
        is_free_trial = false,
        price = original_price
    WHERE id = guest_service_id_in;

    -- Log the conversion event
    INSERT INTO public.guest_service_event_log (guest_service_id, event_type, details)
    VALUES (
        guest_service_id_in,
        'converted_from_trial',
        jsonb_build_object(
            'from', current_details,
            'to', jsonb_build_object('price', original_price, 'is_free_trial', false, 'service_id', (current_details->>'service_id')::uuid)
        )
    );
END;
$$;
-- Drop old functions to update their return types
DROP FUNCTION IF EXISTS public.get_guest_service_details();
DROP FUNCTION IF EXISTS public.get_guest_service_details_by_guest_id(text);

-- Create new get_guest_service_details function with payment_count
CREATE OR REPLACE FUNCTION public.get_guest_service_details()
RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone, is_free_trial boolean, payment_count bigint)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT gs.id, gs.guest_id, COALESCE(g.name, vg.name), COALESCE(g.phone, vg.phone),
           CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END,
           gs.service_id, s.name, gs.price, gs.paid_amount, (gs.price - gs.paid_amount),
           gs.referrer_id, gs.referrer_type, COALESCE(p.full_name, rg.name, rvg.name),
           gs.status, gs.created_at, gs.is_free_trial,
           (SELECT count(*) FROM public.service_payments sp WHERE sp.guest_service_id = gs.id) as payment_count
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

-- Create new get_guest_service_details_by_guest_id function with payment_count
CREATE OR REPLACE FUNCTION public.get_guest_service_details_by_guest_id(guest_id_in text)
RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone, is_free_trial boolean, payment_count bigint)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT gs.id, gs.guest_id, COALESCE(g.name, vg.name), COALESCE(g.phone, vg.phone),
           CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END,
           gs.service_id, s.name, gs.price, gs.paid_amount, (gs.price - gs.paid_amount),
           gs.referrer_id, gs.referrer_type, COALESCE(p.full_name, rg.name, rvg.name),
           gs.status, gs.created_at, gs.is_free_trial,
           (SELECT count(*) FROM public.service_payments sp WHERE sp.guest_service_id = gs.id) as payment_count
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

-- Update the convert_free_trial function to log the conversion event
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
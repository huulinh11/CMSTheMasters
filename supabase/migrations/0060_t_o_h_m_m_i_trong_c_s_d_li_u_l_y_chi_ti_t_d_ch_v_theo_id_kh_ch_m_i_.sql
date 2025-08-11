CREATE OR REPLACE FUNCTION public.get_guest_service_details_by_guest_id(guest_id_in text)
 RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        gs.id,
        gs.guest_id,
        COALESCE(g.name, vg.name) as guest_name,
        COALESCE(g.phone, vg.phone) as guest_phone,
        CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END as guest_type,
        gs.service_id,
        s.name as service_name,
        gs.price,
        gs.paid_amount,
        (gs.price - gs.paid_amount) as unpaid_amount,
        gs.referrer_id,
        gs.referrer_type,
        COALESCE(p.full_name, rg.name, rvg.name) as referrer_name,
        gs.status,
        gs.created_at
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
$function$
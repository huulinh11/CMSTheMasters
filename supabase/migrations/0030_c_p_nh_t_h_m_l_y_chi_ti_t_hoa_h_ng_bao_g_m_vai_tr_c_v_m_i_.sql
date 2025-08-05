CREATE OR REPLACE FUNCTION public.get_upsale_commission_details(upsaled_by_user_id_in uuid)
 RETURNS TABLE(
    upsaled_guest_name text, 
    upsale_amount numeric, 
    commission_earned numeric, 
    upsale_date timestamp with time zone,
    from_role text,
    to_role text
)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH all_guests AS (
        SELECT id, name FROM public.guests
        UNION ALL
        SELECT id, name FROM public.vip_guests
    )
    SELECT
        g.name as upsaled_guest_name,
        ucl.upsale_amount,
        ucl.commission_earned,
        ucl.created_at as upsale_date,
        guh.from_role,
        guh.to_role
    FROM public.upsale_commission_log ucl
    JOIN all_guests g ON ucl.guest_id = g.id
    JOIN public.guest_upsale_history guh ON ucl.guest_upsale_history_id = guh.id
    WHERE ucl.upsaled_by_user_id = upsaled_by_user_id_in
    ORDER BY ucl.created_at DESC;
END;
$function$
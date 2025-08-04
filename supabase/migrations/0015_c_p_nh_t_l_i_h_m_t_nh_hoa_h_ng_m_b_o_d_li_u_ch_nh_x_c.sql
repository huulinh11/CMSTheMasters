-- Update get_upsale_commission_summary to be case-insensitive and robust
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
RETURNS TABLE(
    upsale_person_name text, 
    upsale_count bigint, 
    total_upsale_amount numeric, 
    total_commission numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH upsale_data AS (
        SELECT
            TRIM(upsaled_by) as upsaled_by,
            (to_sponsorship - from_sponsorship) as upsale_amount
        FROM public.guest_upsale_history
        WHERE upsaled_by IS NOT NULL AND TRIM(upsaled_by) != '' AND (to_sponsorship - from_sponsorship) > 0
    ),
    aggregated_upsales AS (
        SELECT
            ud.upsaled_by AS upsale_person_name,
            COUNT(*) AS upsale_count,
            SUM(ud.upsale_amount) AS total_upsale_amount,
            SUM(ud.upsale_amount) * 0.10 AS total_commission
        FROM upsale_data ud
        GROUP BY ud.upsaled_by
    ),
    all_sales_people AS (
        SELECT DISTINCT TRIM(full_name) as person_name FROM public.profiles WHERE role = 'Sale'
        UNION
        SELECT DISTINCT upsale_person_name FROM aggregated_upsales
    )
    SELECT
        asp.person_name as upsale_person_name,
        COALESCE(au.upsale_count, 0) as upsale_count,
        COALESCE(au.total_upsale_amount, 0) as total_upsale_amount,
        COALESCE(au.total_commission, 0) as total_commission
    FROM all_sales_people asp
    LEFT JOIN aggregated_upsales au ON lower(trim(asp.person_name)) = lower(trim(au.upsale_person_name));
END;
$$;

-- Update get_upsale_commission_details to be case-insensitive and join with all guests
CREATE OR REPLACE FUNCTION public.get_upsale_commission_details(upsaled_by_in text)
RETURNS TABLE(
    upsaled_guest_name text,
    upsale_amount numeric,
    commission_earned numeric,
    upsale_date timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH all_guests AS (
        SELECT id, name FROM public.guests
        UNION ALL
        SELECT id, name FROM public.vip_guests
    )
    SELECT
        g.name as upsaled_guest_name,
        (guh.to_sponsorship - guh.from_sponsorship) as upsale_amount,
        (guh.to_sponsorship - guh.from_sponsorship) * 0.10 as commission_earned,
        guh.created_at as upsale_date
    FROM public.guest_upsale_history guh
    JOIN all_guests g ON guh.guest_id = g.id
    WHERE lower(trim(guh.upsaled_by)) = lower(trim(upsaled_by_in)) AND (guh.to_sponsorship - guh.from_sponsorship) > 0
    ORDER BY guh.created_at;
END;
$$;
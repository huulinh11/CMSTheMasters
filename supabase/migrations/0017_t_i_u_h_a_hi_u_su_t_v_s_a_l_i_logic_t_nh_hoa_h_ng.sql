-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_guests_referrer ON public.guests (referrer);
CREATE INDEX IF NOT EXISTS idx_guest_upsale_history_guest_id ON public.guest_upsale_history (guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_upsale_history_upsaled_by_lower_trim ON public.guest_upsale_history (lower(trim(upsaled_by)));
CREATE INDEX IF NOT EXISTS idx_profiles_role_full_name_lower_trim ON public.profiles (role, lower(trim(full_name)));

-- Rewrite guest revenue function for performance
CREATE OR REPLACE FUNCTION public.get_guest_revenue_details()
RETURNS TABLE(id text, name text, role text, phone text, referrer text, notes text, created_at timestamp with time zone, sponsorship numeric, payment_source text, is_upsaled boolean, paid_amount numeric)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH payments_agg AS (
        SELECT
            guest_id,
            COALESCE(SUM(amount), 0) as total_paid
        FROM public.guest_payments
        GROUP BY guest_id
    )
    SELECT
        g.id,
        g.name,
        g.role,
        g.phone,
        g.referrer,
        g.notes,
        g.created_at,
        COALESCE(gr.sponsorship, 0) as sponsorship,
        gr.payment_source,
        COALESCE(gr.is_upsaled, FALSE) as is_upsaled,
        COALESCE(pa.total_paid, 0) as paid_amount
    FROM
        public.guests g
    LEFT JOIN
        public.guest_revenue gr ON g.id = gr.guest_id
    LEFT JOIN
        payments_agg pa ON g.id = pa.guest_id
    ORDER BY g.created_at DESC;
END;
$function$;

-- Rewrite upsale commission summary function for accuracy and robustness
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
RETURNS TABLE(upsale_person_name text, upsale_count bigint, total_upsale_amount numeric, total_commission numeric)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH aggregated_upsales AS (
        SELECT
            lower(trim(guh.upsaled_by)) AS upsaled_by_clean,
            -- Use the original name for display to preserve casing
            trim(guh.upsaled_by) as original_upsaled_by,
            count(*) AS upsale_count,
            sum(guh.to_sponsorship - guh.from_sponsorship) AS total_upsale_amount,
            sum(guh.to_sponsorship - guh.from_sponsorship) * 0.10 AS total_commission
        FROM public.guest_upsale_history guh
        WHERE guh.upsaled_by IS NOT NULL AND trim(guh.upsaled_by) <> '' AND (guh.to_sponsorship - guh.from_sponsorship) > 0
        GROUP BY upsaled_by_clean, original_upsaled_by
    ),
    all_people AS (
        -- Get all people with role 'Sale'
        SELECT lower(trim(p.full_name)) as person_key, p.full_name as display_name
        FROM public.profiles p
        WHERE p.role = 'Sale'
        
        UNION
        
        -- Get all people who have made an upsale, even if not in profiles as 'Sale'
        SELECT au.upsaled_by_clean, au.original_upsaled_by
        FROM aggregated_upsales au
    )
    SELECT
        ap.display_name AS upsale_person_name,
        COALESCE(au.upsale_count, 0) AS upsale_count,
        COALESCE(au.total_upsale_amount, 0) AS total_upsale_amount,
        COALESCE(au.total_commission, 0) AS total_commission
    FROM all_people ap
    LEFT JOIN aggregated_upsales au ON ap.person_key = au.upsaled_by_clean;
END;
$function$;
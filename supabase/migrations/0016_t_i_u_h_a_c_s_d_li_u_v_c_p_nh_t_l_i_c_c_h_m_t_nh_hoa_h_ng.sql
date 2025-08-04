-- Add indexes to improve query performance
CREATE INDEX IF NOT EXISTS idx_guests_referrer ON public.guests (referrer);
CREATE INDEX IF NOT EXISTS idx_guest_upsale_history_guest_id ON public.guest_upsale_history (guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_upsale_history_upsaled_by_lower_trim ON public.guest_upsale_history (lower(trim(upsaled_by)));
CREATE INDEX IF NOT EXISTS idx_profiles_role_full_name_lower_trim ON public.profiles (role, lower(trim(full_name)));

-- Update get_commission_summary for better performance
CREATE OR REPLACE FUNCTION public.get_commission_summary()
 RETURNS TABLE(referrer_name text, commissionable_referrals_count bigint, total_commissionable_amount numeric, total_commission numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH ranked_referrals AS (
        SELECT
            g.referrer,
            g.id as referred_guest_id,
            g.created_at,
            ROW_NUMBER() OVER(PARTITION BY g.referrer ORDER BY g.created_at) as rn
        FROM public.guests g
        WHERE g.referrer IS NOT NULL AND g.referrer != ''
    ),
    first_upsale AS (
        SELECT DISTINCT ON (guest_id)
            guest_id,
            from_sponsorship
        FROM public.guest_upsale_history
        ORDER BY guest_id, created_at ASC
    )
    SELECT
        rr.referrer AS referrer_name,
        COUNT(*) AS commissionable_referrals_count,
        SUM(COALESCE(fu.from_sponsorship, gr.sponsorship)) AS total_commissionable_amount,
        SUM(COALESCE(fu.from_sponsorship, gr.sponsorship)) * 0.10 AS total_commission
    FROM ranked_referrals rr
    JOIN public.guest_revenue gr ON rr.referred_guest_id = gr.guest_id
    LEFT JOIN first_upsale fu ON rr.referred_guest_id = fu.guest_id
    WHERE rr.rn > 10
    GROUP BY rr.referrer
    HAVING COUNT(*) > 0;
END;
$function$;

-- Update get_commission_details for better performance
CREATE OR REPLACE FUNCTION public.get_commission_details(referrer_name_in text)
 RETURNS TABLE(referred_guest_name text, referred_guest_role text, sponsorship_amount numeric, commission_earned numeric, referral_date timestamp with time zone)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH ranked_referrals AS (
        SELECT
            g.referrer,
            g.id as referred_guest_id,
            g.created_at,
            ROW_NUMBER() OVER(PARTITION BY g.referrer ORDER BY g.created_at) as rn
        FROM public.guests g
        WHERE g.referrer IS NOT NULL AND g.referrer != ''
    ),
    first_upsale AS (
        SELECT DISTINCT ON (guest_id)
            guest_id,
            from_sponsorship
        FROM public.guest_upsale_history
        ORDER BY guest_id, created_at ASC
    )
    SELECT
        g.name as referred_guest_name,
        g.role as referred_guest_role,
        COALESCE(fu.from_sponsorship, gr.sponsorship) as sponsorship_amount,
        COALESCE(fu.from_sponsorship, gr.sponsorship) * 0.10 as commission_earned,
        g.created_at as referral_date
    FROM ranked_referrals rr
    JOIN public.guests g ON rr.referred_guest_id = g.id
    JOIN public.guest_revenue gr ON rr.referred_guest_id = gr.guest_id
    LEFT JOIN first_upsale fu ON rr.referred_guest_id = fu.guest_id
    WHERE rr.referrer = referrer_name_in AND rr.rn > 10
    ORDER BY g.created_at;
END;
$function$;

-- Update get_upsale_commission_summary to be case-insensitive and robust
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
RETURNS TABLE(upsale_person_name text, upsale_count bigint, total_upsale_amount numeric, total_commission numeric)
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH aggregated_upsales AS (
        SELECT
            lower(trim(guh.upsaled_by)) AS upsaled_by_clean,
            count(*) AS upsale_count,
            sum(guh.to_sponsorship - guh.from_sponsorship) AS total_upsale_amount,
            sum(guh.to_sponsorship - guh.from_sponsorship) * 0.10 AS total_commission
        FROM public.guest_upsale_history guh
        WHERE guh.upsaled_by IS NOT NULL AND trim(guh.upsaled_by) <> '' AND (guh.to_sponsorship - guh.from_sponsorship) > 0
        GROUP BY upsaled_by_clean
    )
    SELECT
        p.full_name AS upsale_person_name,
        COALESCE(au.upsale_count, 0) AS upsale_count,
        COALESCE(au.total_upsale_amount, 0) AS total_upsale_amount,
        COALESCE(au.total_commission, 0) AS total_commission
    FROM public.profiles p
    LEFT JOIN aggregated_upsales au ON lower(trim(p.full_name)) = au.upsaled_by_clean
    WHERE p.role = 'Sale';
END;
$function$;
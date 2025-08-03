-- Update get_commission_summary
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
    commissionable_referrals AS (
        SELECT
            rr.referrer,
            rr.referred_guest_id,
            COALESCE(
                (SELECT guh.from_sponsorship 
                 FROM public.guest_upsale_history guh 
                 WHERE guh.guest_id = rr.referred_guest_id 
                 ORDER BY guh.created_at ASC 
                 LIMIT 1),
                gr.sponsorship
            ) as commissionable_sponsorship
        FROM ranked_referrals rr
        JOIN public.guest_revenue gr ON rr.referred_guest_id = gr.guest_id
        WHERE rr.rn > 10 -- Commission starts from the 11th referral
    )
    SELECT
        cr.referrer AS referrer_name,
        COUNT(*) AS commissionable_referrals_count,
        SUM(cr.commissionable_sponsorship) AS total_commissionable_amount,
        SUM(cr.commissionable_sponsorship) * 0.10 AS total_commission
    FROM commissionable_referrals cr
    GROUP BY cr.referrer
    HAVING COUNT(*) > 0;
END;
$function$;

-- Update get_commission_details
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
    )
    SELECT
        g.name as referred_guest_name,
        g.role as referred_guest_role,
        COALESCE(
            (SELECT guh.from_sponsorship 
             FROM public.guest_upsale_history guh 
             WHERE guh.guest_id = rr.referred_guest_id 
             ORDER BY guh.created_at ASC 
             LIMIT 1),
            gr.sponsorship
        ) as sponsorship_amount,
        COALESCE(
            (SELECT guh.from_sponsorship 
             FROM public.guest_upsale_history guh 
             WHERE guh.guest_id = rr.referred_guest_id 
             ORDER BY guh.created_at ASC 
             LIMIT 1),
            gr.sponsorship
        ) * 0.10 as commission_earned,
        g.created_at as referral_date
    FROM ranked_referrals rr
    JOIN public.guests g ON rr.referred_guest_id = g.id
    JOIN public.guest_revenue gr ON rr.referred_guest_id = gr.guest_id
    WHERE rr.referrer = referrer_name_in AND rr.rn > 10
    ORDER BY g.created_at;
END;
$function$;
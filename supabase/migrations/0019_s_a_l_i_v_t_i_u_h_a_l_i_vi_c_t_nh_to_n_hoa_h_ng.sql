-- Step 1: Update the referral commission function to be more robust
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
        COUNT(rr.referred_guest_id) AS commissionable_referrals_count,
        SUM(COALESCE(fu.from_sponsorship, gr.sponsorship, 0)) AS total_commissionable_amount,
        SUM(COALESCE(fu.from_sponsorship, gr.sponsorship, 0)) * 0.10 AS total_commission
    FROM ranked_referrals rr
    LEFT JOIN public.guest_revenue gr ON rr.referred_guest_id = gr.guest_id
    LEFT JOIN first_upsale fu ON rr.referred_guest_id = fu.guest_id
    WHERE rr.rn > 10
    GROUP BY rr.referrer
    HAVING COUNT(rr.referred_guest_id) > 0;
END;
$function$;

-- Step 2: Update the upsale commission function for correctness
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
 RETURNS TABLE(upsale_person_name text, upsale_count bigint, total_upsale_amount numeric, total_commission numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        trim(guh.upsaled_by) as upsale_person_name,
        count(*) AS upsale_count,
        sum(guh.to_sponsorship - guh.from_sponsorship) AS total_upsale_amount,
        sum(guh.to_sponsorship - guh.from_sponsorship) * 0.10 AS total_commission
    FROM public.guest_upsale_history guh
    WHERE guh.upsaled_by IS NOT NULL AND trim(guh.upsaled_by) <> '' AND (guh.to_sponsorship - guh.from_sponsorship) > 0
    GROUP BY trim(guh.upsaled_by);
END;
$function$;

-- Step 3: Refresh the summary tables with the corrected data
SELECT refresh_referral_commission_summary();
SELECT refresh_upsale_commission_summary();
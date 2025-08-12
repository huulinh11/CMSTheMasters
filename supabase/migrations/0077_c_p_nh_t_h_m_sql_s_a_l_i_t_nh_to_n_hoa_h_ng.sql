DROP FUNCTION IF EXISTS public.get_referrer_summary();
CREATE OR REPLACE FUNCTION public.get_referrer_summary()
 RETURNS TABLE(referrer_id text, referrer_name text, referrer_role text, referral_count bigint, referral_quota integer, total_revenue numeric, total_commission numeric)
 LANGUAGE sql
AS $function$
WITH all_referrers AS (
    SELECT DISTINCT referrer AS id FROM public.guests WHERE referrer IS NOT NULL
),
ranked_referrals AS (
    SELECT
        g.referrer,
        g.id AS guest_id,
        gr.sponsorship,
        gr.payment_source,
        ROW_NUMBER() OVER(PARTITION BY g.referrer ORDER BY g.created_at ASC) as rn
    FROM public.guests g
    LEFT JOIN public.guest_revenue gr ON g.id = gr.guest_id
    WHERE g.referrer IS NOT NULL
),
revenue_and_commission_calc AS (
    SELECT
        rr.referrer,
        SUM(
            CASE
                WHEN rr.rn > COALESCE(rc.referral_quota, 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0)
                ELSE 0
            END
        ) as calculated_revenue,
        SUM(
            CASE
                WHEN rr.rn > COALESCE(rc.referral_quota, 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0) * 0.10
                ELSE 0
            END
        ) as calculated_commission
    FROM ranked_referrals rr
    JOIN public.vip_guests vg ON rr.referrer = vg.id
    LEFT JOIN public.role_configurations rc ON vg.role = rc.name
    GROUP BY rr.referrer
),
referral_counts AS (
    SELECT referrer, COUNT(*) as num_referrals
    FROM public.guests
    WHERE referrer IS NOT NULL
    GROUP BY referrer
)
SELECT
    ar.id AS referrer_id,
    vg.name AS referrer_name,
    vg.role AS referrer_role,
    COALESCE(rcount.num_referrals, 0) AS referral_count,
    COALESCE(rconfig.referral_quota, 10)::INT AS referral_quota,
    COALESCE(r_and_c.calculated_revenue, 0) AS total_revenue,
    COALESCE(r_and_c.calculated_commission, 0) AS total_commission
FROM all_referrers ar
JOIN public.vip_guests vg ON ar.id = vg.id
LEFT JOIN referral_counts rcount ON ar.id = rcount.referrer
LEFT JOIN public.role_configurations rconfig ON vg.role = rconfig.name
LEFT JOIN revenue_and_commission_calc r_and_c ON ar.id = r_and_c.referrer;
$function$;
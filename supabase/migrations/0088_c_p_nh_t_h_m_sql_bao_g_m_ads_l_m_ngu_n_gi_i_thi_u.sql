CREATE OR REPLACE FUNCTION public.get_referrer_summary()
 RETURNS TABLE(referrer_id text, referrer_name text, referrer_role text, referral_count bigint, referral_quota integer, total_revenue numeric, total_commission numeric)
 LANGUAGE sql
AS $function$
    -- VIP Guest Referrers
    WITH vip_referrers AS (
        SELECT DISTINCT referrer AS id FROM public.guests WHERE referrer IS NOT NULL AND referrer != 'ads'
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
        WHERE g.referrer IS NOT NULL AND g.referrer != 'ads'
    ),
    vip_revenue_and_commission_calc AS (
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
    vip_referral_counts AS (
        SELECT referrer, COUNT(*) as num_referrals
        FROM public.guests
        WHERE referrer IS NOT NULL AND referrer != 'ads'
        GROUP BY referrer
    )
    SELECT
        vr.id AS referrer_id,
        vg.name AS referrer_name,
        vg.role AS referrer_role,
        COALESCE(vrc.num_referrals, 0) AS referral_count,
        COALESCE(rconfig.referral_quota, 10)::INT AS referral_quota,
        COALESCE(vrcc.calculated_revenue, 0) AS total_revenue,
        COALESCE(vrcc.calculated_commission, 0) AS total_commission
    FROM vip_referrers vr
    JOIN public.vip_guests vg ON vr.id = vg.id
    LEFT JOIN vip_referral_counts vrc ON vr.id = vrc.referrer
    LEFT JOIN public.role_configurations rconfig ON vg.role = rconfig.name
    LEFT JOIN vip_revenue_and_commission_calc vrcc ON vr.id = vrcc.referrer

    UNION ALL

    -- Ads Referrer
    SELECT
        'ads' AS referrer_id,
        'Ads' AS referrer_name,
        'Nguồn' AS referrer_role,
        COUNT(*) AS referral_count,
        0 AS referral_quota,
        COALESCE(SUM(gr.sponsorship), 0) AS total_revenue,
        COALESCE(SUM(gr.sponsorship * 0.10), 0) AS total_commission
    FROM public.guests g
    LEFT JOIN public.guest_revenue gr ON g.id = gr.guest_id
    WHERE g.referrer = 'ads';
$function$
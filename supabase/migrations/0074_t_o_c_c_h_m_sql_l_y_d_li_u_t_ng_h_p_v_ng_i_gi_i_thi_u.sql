-- Function to get a detailed summary for each referrer
CREATE OR REPLACE FUNCTION get_referrer_summary()
RETURNS TABLE(
    referrer_id TEXT,
    referrer_name TEXT,
    referral_count BIGINT,
    total_revenue NUMERIC,
    total_commission NUMERIC
)
LANGUAGE sql
AS $$
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
revenue_calc AS (
    SELECT
        rr.referrer,
        SUM(
            CASE
                WHEN rr.rn > COALESCE(rc.referral_quota, 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0)
                ELSE 0
            END
        ) as calculated_revenue
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
    COALESCE(rc.num_referrals, 0) AS referral_count,
    COALESCE(rev.calculated_revenue, 0) AS total_revenue,
    COALESCE(rcs.total_commission, 0) AS total_commission
FROM all_referrers ar
JOIN public.vip_guests vg ON ar.id = vg.id
LEFT JOIN referral_counts rc ON ar.id = rc.referrer
LEFT JOIN revenue_calc rev ON ar.id = rev.referrer
LEFT JOIN public.referral_commission_summary rcs ON ar.id = rcs.referrer_name;
$$;

-- Function to get details of all guests referred by a specific person
CREATE OR REPLACE FUNCTION get_all_referred_guests_details(referrer_id_in TEXT)
RETURNS TABLE(
    guest_id TEXT,
    guest_name TEXT,
    guest_role TEXT,
    sponsorship_amount NUMERIC,
    commission_earned NUMERIC,
    is_commissionable BOOLEAN
)
LANGUAGE sql
AS $$
SELECT
    g.id AS guest_id,
    g.name AS guest_name,
    g.role AS guest_role,
    COALESCE(gr.sponsorship, 0) AS sponsorship_amount,
    COALESCE(rcl.commission_earned, 0) AS commission_earned,
    (rcl.id IS NOT NULL) AS is_commissionable
FROM public.guests g
LEFT JOIN public.guest_revenue gr ON g.id = gr.guest_id
LEFT JOIN public.referral_commission_log rcl ON g.id = rcl.referred_guest_id AND rcl.referrer_name = referrer_id_in
WHERE g.referrer = referrer_id_in
ORDER BY g.created_at ASC;
$$;
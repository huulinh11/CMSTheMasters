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
WITH ranked_referrals AS (
    SELECT
        g.id,
        g.name,
        g.role,
        gr.sponsorship,
        gr.payment_source,
        ROW_NUMBER() OVER(ORDER BY g.created_at ASC) as rn
    FROM public.guests g
    LEFT JOIN public.guest_revenue gr ON g.id = gr.guest_id
    WHERE g.referrer = referrer_id_in
),
referrer_config AS (
    SELECT
        rc.referral_quota
    FROM public.vip_guests vg
    JOIN public.role_configurations rc ON vg.role = rc.name
    WHERE vg.id = referrer_id_in
    LIMIT 1
)
SELECT
    rr.id AS guest_id,
    rr.name AS guest_name,
    rr.role AS guest_role,
    CASE
        WHEN rr.rn > COALESCE((SELECT referral_quota FROM referrer_config), 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0)
        ELSE 0
    END AS sponsorship_amount,
    COALESCE(rcl.commission_earned, 0) AS commission_earned,
    (rcl.id IS NOT NULL) AS is_commissionable
FROM ranked_referrals rr
LEFT JOIN public.referral_commission_log rcl ON rr.id = rcl.referred_guest_id AND rcl.referrer_name = referrer_id_in
ORDER BY rr.rn ASC;
$$;
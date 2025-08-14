CREATE OR REPLACE FUNCTION public.get_all_referred_guests_details(referrer_id_in text)
RETURNS TABLE(guest_id text, guest_name text, guest_role text, sponsorship_amount numeric, commission_earned numeric, is_commissionable boolean)
LANGUAGE plpgsql
AS $function$
BEGIN
    IF referrer_id_in = 'ads' THEN
        RETURN QUERY
        SELECT
            g.id,
            g.name,
            g.role,
            COALESCE(gr.sponsorship, 0),
            COALESCE(gr.sponsorship, 0) * 0.10,
            (COALESCE(gr.sponsorship, 0) > 0)
        FROM public.guests g
        LEFT JOIN public.guest_revenue gr ON g.id = gr.guest_id
        WHERE g.referrer = 'ads'
        ORDER BY g.created_at ASC;
    ELSE
        RETURN QUERY
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
            rr.id,
            rr.name,
            rr.role,
            CASE
                WHEN rr.rn > COALESCE((SELECT referral_quota FROM referrer_config), 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0)
                ELSE 0
            END,
            CASE
                WHEN rr.rn > COALESCE((SELECT referral_quota FROM referrer_config), 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0) * 0.10
                ELSE 0
            END,
            (CASE
                WHEN rr.rn > COALESCE((SELECT referral_quota FROM referrer_config), 10) OR rr.payment_source = 'BTC' THEN COALESCE(rr.sponsorship, 0) > 0
                ELSE false
            END)
        FROM ranked_referrals rr
        ORDER BY rr.rn ASC;
    END IF;
END;
$function$
DROP FUNCTION IF EXISTS public.get_guest_revenue_details();

CREATE OR REPLACE FUNCTION public.get_guest_revenue_details()
 RETURNS TABLE(id text, name text, role text, phone text, referrer text, notes text, created_at timestamp with time zone, sponsorship numeric, payment_source text, is_upsaled boolean, paid_amount numeric, bill_image_url text, slug text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        g.role,
        g.phone,
        (SELECT r.name FROM public.vip_guests r WHERE r.id = g.referrer) as referrer,
        g.notes,
        g.created_at,
        COALESCE(gr.sponsorship, 0) as sponsorship,
        gr.payment_source,
        COALESCE(gr.is_upsaled, FALSE) as is_upsaled,
        pa.total_paid as paid_amount,
        lu.bill_image_url,
        g.slug
    FROM
        public.guests g
    LEFT JOIN
        public.guest_revenue gr ON g.id = gr.guest_id
    LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(p.amount), 0) as total_paid
        FROM public.guest_payments p
        WHERE p.guest_id = g.id
    ) pa ON true
    LEFT JOIN LATERAL (
        SELECT h.bill_image_url
        FROM public.guest_upsale_history h
        WHERE h.guest_id = g.id
        ORDER BY h.created_at DESC
        LIMIT 1
    ) lu ON true
    ORDER BY g.created_at DESC;
END;
$function$
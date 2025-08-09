-- Drop the existing function first to allow changing the return type
DROP FUNCTION public.get_guest_revenue_details();

-- Recreate the function with the new bill_image_url column
CREATE FUNCTION public.get_guest_revenue_details()
 RETURNS TABLE(id text, name text, role text, phone text, referrer text, notes text, created_at timestamp with time zone, sponsorship numeric, payment_source text, is_upsaled boolean, paid_amount numeric, bill_image_url text)
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
    ),
    latest_upsale AS (
        SELECT 
            guest_id,
            bill_image_url,
            ROW_NUMBER() OVER(PARTITION BY guest_id ORDER BY created_at DESC) as rn
        FROM public.guest_upsale_history
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
        COALESCE(pa.total_paid, 0) as paid_amount,
        lu.bill_image_url
    FROM
        public.guests g
    LEFT JOIN
        public.guest_revenue gr ON g.id = gr.guest_id
    LEFT JOIN
        payments_agg pa ON g.id = pa.guest_id
    LEFT JOIN
        latest_upsale lu ON g.id = lu.guest_id AND lu.rn = 1
    ORDER BY g.created_at DESC;
END;
$function$;
DROP FUNCTION IF EXISTS public.get_vip_guest_revenue_details();

CREATE OR REPLACE FUNCTION public.get_vip_guest_revenue_details()
 RETURNS TABLE(id text, name text, role text, secondary_info text, phone text, referrer text, notes text, created_at timestamp with time zone, sponsorship numeric, paid_amount numeric, materials text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT
        vg.id,
        vg.name,
        vg.role,
        vg.secondary_info,
        vg.phone,
        (SELECT r.name FROM public.vip_guests r WHERE r.id = vg.referrer) as referrer,
        vg.notes,
        vg.created_at,
        COALESCE(vgr.sponsorship, 0) as sponsorship,
        (SELECT COALESCE(SUM(vp.amount), 0) FROM public.vip_payments vp WHERE vp.guest_id = vg.id) as paid_amount,
        vg.materials
    FROM
        public.vip_guests vg
    LEFT JOIN
        public.vip_guest_revenue vgr ON vg.id = vgr.guest_id
    ORDER BY vg.created_at DESC;
END;
$function$
-- Step 1: One-time data migration from referrer name to referrer ID
DO $$
DECLARE
    rec RECORD;
    referrer_id_val TEXT;
BEGIN
    -- Update vip_guests table
    FOR rec IN SELECT id, referrer FROM public.vip_guests WHERE referrer IS NOT NULL AND referrer NOT IN (SELECT id FROM public.vip_guests)
    LOOP
        SELECT id INTO referrer_id_val FROM public.vip_guests WHERE name = rec.referrer LIMIT 1;
        IF referrer_id_val IS NOT NULL THEN
            UPDATE public.vip_guests SET referrer = referrer_id_val WHERE id = rec.id;
        END IF;
    END LOOP;

    -- Update guests table
    FOR rec IN SELECT id, referrer FROM public.guests WHERE referrer IS NOT NULL AND referrer NOT IN (SELECT id FROM public.vip_guests)
    LOOP
        SELECT id INTO referrer_id_val FROM public.vip_guests WHERE name = rec.referrer LIMIT 1;
        IF referrer_id_val IS NOT NULL THEN
            UPDATE public.guests SET referrer = referrer_id_val WHERE id = rec.id;
        END IF;
    END LOOP;
END $$;

-- Step 2: Update get_referred_guests to search by ID
CREATE OR REPLACE FUNCTION public.get_referred_guests(referrer_name_in text)
 RETURNS TABLE(id text, name text, role text, phone text, type text)
 LANGUAGE plpgsql
AS $function$
begin
  -- The parameter now receives an ID, but we keep the name for compatibility.
  return query
  select g.id, g.name, g.role, g.phone, 'Khách mời' as type
  from public.guests as g
  where g.referrer = referrer_name_in
  union all
  select vg.id, vg.name, vg.role, vg.phone, 'Chức vụ' as type
  from public.vip_guests as vg
  where vg.referrer = referrer_name_in;
end;
$function$;

-- Step 3: Update revenue functions to join referrer name from ID
CREATE OR REPLACE FUNCTION public.get_vip_guest_revenue_details()
 RETURNS TABLE(id text, name text, role text, secondary_info text, phone text, referrer text, notes text, created_at timestamp with time zone, sponsorship numeric, paid_amount numeric)
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
        (SELECT COALESCE(SUM(vp.amount), 0) FROM public.vip_payments vp WHERE vp.guest_id = vg.id) as paid_amount
    FROM
        public.vip_guests vg
    LEFT JOIN
        public.vip_guest_revenue vgr ON vg.id = vgr.guest_id
    ORDER BY vg.created_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_guest_revenue_details()
 RETURNS TABLE(id text, name text, role text, phone text, referrer text, notes text, created_at timestamp with time zone, sponsorship numeric, payment_source text, is_upsaled boolean, paid_amount numeric, bill_image_url text)
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
        lu.bill_image_url
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
$function$;
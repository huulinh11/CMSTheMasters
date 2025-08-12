-- Thêm cột ghi chú vào bảng dịch vụ của khách
ALTER TABLE public.guest_services ADD COLUMN notes TEXT;

-- Xóa hàm cũ trước khi tạo lại với cột mới
DROP FUNCTION IF EXISTS public.get_guest_service_details();

-- Tạo lại hàm để lấy chi tiết tất cả dịch vụ của khách, bao gồm cả ghi chú
CREATE OR REPLACE FUNCTION public.get_guest_service_details()
 RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone, is_free_trial boolean, payment_count bigint, notes text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT gs.id, gs.guest_id, COALESCE(g.name, vg.name), COALESCE(g.phone, vg.phone),
           CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END,
           gs.service_id, s.name, gs.price, gs.paid_amount, (gs.price - gs.paid_amount),
           gs.referrer_id, gs.referrer_type, COALESCE(p.full_name, rg.name, rvg.name),
           gs.status, gs.created_at, gs.is_free_trial,
           (SELECT count(*) FROM public.service_payments sp WHERE sp.guest_service_id = gs.id) as payment_count,
           gs.notes
    FROM public.guest_services gs
    JOIN public.services s ON gs.service_id = s.id
    LEFT JOIN public.guests g ON gs.guest_id = g.id
    LEFT JOIN public.vip_guests vg ON gs.guest_id = vg.id
    LEFT JOIN public.profiles p ON gs.referrer_type = 'sale' AND gs.referrer_id = p.id::text
    LEFT JOIN public.guests rg ON gs.referrer_type = 'guest' AND gs.referrer_id = rg.id
    LEFT JOIN public.vip_guests rvg ON gs.referrer_type = 'guest' AND gs.referrer_id = rvg.id
    WHERE COALESCE(g.id, vg.id) IS NOT NULL
    ORDER BY gs.created_at DESC;
END;
$function$;

-- Xóa hàm cũ trước khi tạo lại với cột mới
DROP FUNCTION IF EXISTS public.get_guest_service_details_by_guest_id(text);

-- Tạo lại hàm để lấy chi tiết dịch vụ theo ID khách, bao gồm cả ghi chú
CREATE OR REPLACE FUNCTION public.get_guest_service_details_by_guest_id(guest_id_in text)
 RETURNS TABLE(id uuid, guest_id text, guest_name text, guest_phone text, guest_type text, service_id uuid, service_name text, price numeric, paid_amount numeric, unpaid_amount numeric, referrer_id text, referrer_type text, referrer_name text, status text, created_at timestamp with time zone, is_free_trial boolean, payment_count bigint, notes text)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT gs.id, gs.guest_id, COALESCE(g.name, vg.name), COALESCE(g.phone, vg.phone),
           CASE WHEN vg.id IS NOT NULL THEN 'Chức vụ' ELSE 'Khách mời' END,
           gs.service_id, s.name, gs.price, gs.paid_amount, (gs.price - gs.paid_amount),
           gs.referrer_id, gs.referrer_type, COALESCE(p.full_name, rg.name, rvg.name),
           gs.status, gs.created_at, gs.is_free_trial,
           (SELECT count(*) FROM public.service_payments sp WHERE sp.guest_service_id = gs.id) as payment_count,
           gs.notes
    FROM public.guest_services gs
    JOIN public.services s ON gs.service_id = s.id
    LEFT JOIN public.guests g ON gs.guest_id = g.id
    LEFT JOIN public.vip_guests vg ON gs.guest_id = vg.id
    LEFT JOIN public.profiles p ON gs.referrer_type = 'sale' AND gs.referrer_id = p.id::text
    LEFT JOIN public.guests rg ON gs.referrer_type = 'guest' AND gs.referrer_id = rg.id
    LEFT JOIN public.vip_guests rvg ON gs.referrer_type = 'guest' AND gs.referrer_id = rvg.id
    WHERE gs.guest_id = guest_id_in
    ORDER BY gs.created_at DESC;
END;
$function$;
CREATE OR REPLACE FUNCTION public.resolve_slug_conflict(
    p_requested_slug TEXT,
    p_provided_name TEXT,
    p_provided_phone TEXT
)
RETURNS TABLE (status TEXT, new_slug TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    name_part TEXT;
    matched_guest RECORD;
    guest_type TEXT;
BEGIN
    -- Chỉ cố gắng tự động duyệt nếu người dùng cung cấp số điện thoại
    IF p_provided_phone IS NOT NULL AND p_provided_phone <> '' THEN
        -- Trích xuất phần tên từ slug
        name_part := substring(p_requested_slug from '^(.*)-');

        -- Tìm khách mời có phần tên và SĐT trùng khớp
        SELECT g.id, g.slug, 'regular' as type INTO matched_guest FROM public.guests g WHERE g.slug LIKE (name_part || '%') AND g.phone = p_provided_phone
        UNION ALL
        SELECT vg.id, vg.slug, 'vip' as type FROM public.vip_guests vg WHERE vg.slug LIKE (name_part || '%') AND vg.phone = p_provided_phone
        LIMIT 1;

        IF FOUND THEN
            -- Nếu tìm thấy, tự động duyệt
            guest_type := CASE WHEN matched_guest.type = 'vip' THEN 'vip' ELSE 'regular' END;

            INSERT INTO public.slug_aliases (old_slug, guest_id, guest_type)
            VALUES (p_requested_slug, matched_guest.id, guest_type);

            INSERT INTO public.slug_resolution_requests (requested_slug, provided_name, provided_phone, status)
            VALUES (p_requested_slug, p_provided_name, p_provided_phone, 'approved');

            RETURN QUERY SELECT 'approved'::TEXT, matched_guest.slug::TEXT;
            RETURN; -- Kết thúc hàm
        END IF;
    END IF;

    -- Nếu không có SĐT, hoặc SĐT không khớp, tạo yêu cầu chờ duyệt
    INSERT INTO public.slug_resolution_requests (requested_slug, provided_name, provided_phone, status)
    VALUES (p_requested_slug, p_provided_name, p_provided_phone, 'pending');

    RETURN QUERY SELECT 'pending'::TEXT, NULL::TEXT;
END;
$$;
CREATE OR REPLACE FUNCTION resolve_slug_conflict(
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
    -- Extract the name part from the slug
    name_part := substring(p_requested_slug from '^(.*)-');

    -- Find a guest with a matching name part and the provided phone number
    SELECT g.id, g.slug, 'regular' as type INTO matched_guest FROM public.guests g WHERE g.slug LIKE (name_part || '%') AND g.phone = p_provided_phone
    UNION ALL
    SELECT vg.id, vg.slug, 'vip' as type FROM public.vip_guests vg WHERE vg.slug LIKE (name_part || '%') AND vg.phone = p_provided_phone
    LIMIT 1;

    IF FOUND THEN
        -- Match found, auto-approve
        guest_type := CASE WHEN matched_guest.type = 'vip' THEN 'vip' ELSE 'regular' END;

        -- Create an alias for the old slug
        INSERT INTO public.slug_aliases (old_slug, guest_id, guest_type)
        VALUES (p_requested_slug, matched_guest.id, guest_type);

        -- Create a request record with 'approved' status
        INSERT INTO public.slug_resolution_requests (requested_slug, provided_name, provided_phone, status)
        VALUES (p_requested_slug, p_provided_name, p_provided_phone, 'approved');

        RETURN QUERY SELECT 'approved'::TEXT, matched_guest.slug::TEXT;
    ELSE
        -- No match, create a pending request for admin review
        INSERT INTO public.slug_resolution_requests (requested_slug, provided_name, provided_phone, status)
        VALUES (p_requested_slug, p_provided_name, p_provided_phone, 'pending');

        RETURN QUERY SELECT 'pending'::TEXT, NULL::TEXT;
    END IF;
END;
$$;
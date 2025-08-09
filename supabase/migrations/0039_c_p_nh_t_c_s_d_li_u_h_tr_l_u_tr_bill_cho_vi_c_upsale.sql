-- Add bill image URL to upsale history
ALTER TABLE public.guest_upsale_history
ADD COLUMN bill_image_url TEXT;

-- Update the upsale function to accept and store the bill image URL
CREATE OR REPLACE FUNCTION public.upsale_guest(
    guest_id_in text, 
    new_role_in text, 
    new_sponsorship_in numeric, 
    new_payment_source_in text, 
    upsaled_by_in text, 
    upsaled_by_user_id_in uuid,
    bill_image_url_in text
)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    old_role_val TEXT;
    old_sponsorship_val NUMERIC;
    old_payment_source_val TEXT;
BEGIN
    -- Get old values for history log
    SELECT g.role, COALESCE(gr.sponsorship, 0), gr.payment_source
    INTO old_role_val, old_sponsorship_val, old_payment_source_val
    FROM public.guests g
    LEFT JOIN public.guest_revenue gr ON g.id = gr.guest_id
    WHERE g.id = guest_id_in;

    -- Update the guest's role
    UPDATE public.guests
    SET role = new_role_in
    WHERE id = guest_id_in;

    -- Update the guest's revenue details
    UPDATE public.guest_revenue
    SET
        sponsorship = new_sponsorship_in,
        payment_source = new_payment_source_in,
        is_upsaled = TRUE
    WHERE guest_id = guest_id_in;

    -- Insert into history log with the new user_id and bill_image_url
    INSERT INTO public.guest_upsale_history (guest_id, from_role, to_role, from_sponsorship, to_sponsorship, from_payment_source, upsaled_by, upsaled_by_user_id, bill_image_url)
    VALUES (guest_id_in, old_role_val, new_role_in, old_sponsorship_val, new_sponsorship_in, old_payment_source_val, upsaled_by_in, upsaled_by_user_id_in, bill_image_url_in);
END;
$function$;
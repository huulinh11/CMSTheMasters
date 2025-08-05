-- Step 1: Add user_id columns to track who performed the upsale reliably
ALTER TABLE public.guest_upsale_history ADD COLUMN IF NOT EXISTS upsaled_by_user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.upsale_commission_log ADD COLUMN IF NOT EXISTS upsaled_by_user_id UUID;

-- Step 2: Update the main upsale function to accept and store the user_id
CREATE OR REPLACE FUNCTION public.upsale_guest(guest_id_in text, new_role_in text, new_sponsorship_in numeric, new_payment_source_in text, upsaled_by_in text, upsaled_by_user_id_in uuid)
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

    -- Insert into history log with the new user_id
    INSERT INTO public.guest_upsale_history (guest_id, from_role, to_role, from_sponsorship, to_sponsorship, from_payment_source, upsaled_by, upsaled_by_user_id)
    VALUES (guest_id_in, old_role_val, new_role_in, old_sponsorship_val, new_sponsorship_in, old_payment_source_val, upsaled_by_in, upsaled_by_user_id_in);
END;
$function$;

-- Step 3: Update the trigger function to pass the user_id to the commission log
CREATE OR REPLACE FUNCTION public.handle_upsale_for_commission()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    upsale_val NUMERIC;
BEGIN
    IF NEW.upsaled_by IS NOT NULL AND NEW.upsaled_by <> '' THEN
        upsale_val := NEW.to_sponsorship - NEW.from_sponsorship;
        IF upsale_val > 0 THEN
            INSERT INTO public.upsale_commission_log (upsale_person_name, guest_id, upsale_amount, commission_earned, guest_upsale_history_id, upsaled_by_user_id)
            VALUES (NEW.upsaled_by, NEW.guest_id, upsale_val, upsale_val * 0.10, NEW.id, NEW.upsaled_by_user_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- Step 4: Update the summary function to group by the reliable user_id
CREATE OR REPLACE FUNCTION public.refresh_upsale_commission_summary()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    TRUNCATE TABLE public.upsale_commission_summary;

    INSERT INTO public.upsale_commission_summary (user_id, upsale_person_name, upsale_count, total_upsale_amount, total_commission, updated_at)
    SELECT
        ucl.upsaled_by_user_id as user_id,
        ucl.upsale_person_name,
        count(*) as upsale_count,
        sum(ucl.upsale_amount) as total_upsale_amount,
        sum(ucl.commission_earned) as total_commission,
        now()
    FROM public.upsale_commission_log ucl
    WHERE ucl.upsaled_by_user_id IS NOT NULL
    GROUP BY ucl.upsaled_by_user_id, ucl.upsale_person_name;
END;
$function$;
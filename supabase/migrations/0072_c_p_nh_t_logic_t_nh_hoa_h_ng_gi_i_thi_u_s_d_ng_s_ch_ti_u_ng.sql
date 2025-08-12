CREATE OR REPLACE FUNCTION public.handle_new_guest_for_commission()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    referral_count INT;
    sponsorship_val NUMERIC;
    referrer_role TEXT;
    referral_quota_val INT;
BEGIN
    -- Only proceed if there is a referrer
    IF NEW.referrer IS NOT NULL AND NEW.referrer <> '' THEN
        -- Get the role of the referrer from the vip_guests table
        SELECT role INTO referrer_role
        FROM public.vip_guests
        WHERE id = NEW.referrer;

        -- If the referrer's role is found, get their referral quota
        IF FOUND THEN
            SELECT referral_quota INTO referral_quota_val
            FROM public.role_configurations
            WHERE name = referrer_role;

            -- If no specific quota is found for the role, default to 10
            IF NOT FOUND THEN
                referral_quota_val := 10;
            END IF;

            -- Count existing commissionable referrals for this referrer
            SELECT count(*) INTO referral_count
            FROM public.guests
            WHERE referrer = NEW.referrer AND id <> NEW.id;

            -- Check if the referral count meets or exceeds the quota
            IF referral_count >= referral_quota_val THEN
                -- Get sponsorship amount for the new guest
                SELECT sponsorship INTO sponsorship_val
                FROM public.guest_revenue
                WHERE guest_id = NEW.id;

                IF sponsorship_val IS NOT NULL AND sponsorship_val > 0 THEN
                    -- Insert into commission log
                    INSERT INTO public.referral_commission_log (referrer_name, referred_guest_id, sponsorship_amount, commission_earned)
                    VALUES (NEW.referrer, NEW.id, sponsorship_val, sponsorship_val * 0.10);
                END IF;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
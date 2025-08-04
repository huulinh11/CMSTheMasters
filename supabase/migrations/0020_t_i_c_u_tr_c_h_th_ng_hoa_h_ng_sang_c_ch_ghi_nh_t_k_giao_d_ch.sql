-- Step 1: Clean up old summary tables and related functions/triggers
DROP TRIGGER IF EXISTS on_guest_change ON public.guests;
DROP TRIGGER IF EXISTS on_guest_revenue_change ON public.guest_revenue;
DROP TRIGGER IF EXISTS on_guest_upsale_history_change_for_referral ON public.guest_upsale_history;
DROP TRIGGER IF EXISTS on_guest_upsale_history_change_for_upsale ON public.guest_upsale_history;
DROP TRIGGER IF EXISTS on_profiles_change_for_upsale ON public.profiles;

DROP FUNCTION IF EXISTS public.trigger_refresh_referral_commission();
DROP FUNCTION IF EXISTS public.trigger_refresh_upsale_commission();
DROP FUNCTION IF EXISTS public.refresh_referral_commission_summary();
DROP FUNCTION IF EXISTS public.refresh_upsale_commission_summary();

DROP TABLE IF EXISTS public.referral_commission_summary CASCADE;
DROP TABLE IF EXISTS public.upsale_commission_summary CASCADE;

-- Step 2: Create new commission log tables
CREATE TABLE public.referral_commission_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_name TEXT NOT NULL,
    referred_guest_id TEXT NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
    sponsorship_amount NUMERIC NOT NULL,
    commission_earned NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referral_commission_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to referral commission log" ON public.referral_commission_log FOR ALL USING (true);

CREATE TABLE public.upsale_commission_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upsale_person_name TEXT NOT NULL,
    guest_id TEXT NOT NULL,
    upsale_amount NUMERIC NOT NULL,
    commission_earned NUMERIC NOT NULL,
    guest_upsale_history_id UUID NOT NULL REFERENCES public.guest_upsale_history(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.upsale_commission_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to upsale commission log" ON public.upsale_commission_log FOR ALL USING (true);

-- Step 3: Create functions to log commissions
CREATE OR REPLACE FUNCTION public.handle_new_guest_for_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    referral_count INT;
    sponsorship_val NUMERIC;
BEGIN
    IF NEW.referrer IS NOT NULL AND NEW.referrer <> '' THEN
        -- Count existing commissionable referrals for this referrer
        SELECT count(*) INTO referral_count
        FROM public.guests
        WHERE referrer = NEW.referrer AND id <> NEW.id;

        -- Commission starts from the 11th referral (i.e., when count is 10)
        IF referral_count >= 10 THEN
            -- Get sponsorship amount
            SELECT sponsorship INTO sponsorship_val
            FROM public.guest_revenue
            WHERE guest_id = NEW.id;

            IF sponsorship_val IS NOT NULL AND sponsorship_val > 0 THEN
                -- Insert into log
                INSERT INTO public.referral_commission_log (referrer_name, referred_guest_id, sponsorship_amount, commission_earned)
                VALUES (NEW.referrer, NEW.id, sponsorship_val, sponsorship_val * 0.10);
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_upsale_for_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    upsale_val NUMERIC;
BEGIN
    IF NEW.upsaled_by IS NOT NULL AND NEW.upsaled_by <> '' THEN
        upsale_val := NEW.to_sponsorship - NEW.from_sponsorship;
        IF upsale_val > 0 THEN
            INSERT INTO public.upsale_commission_log (upsale_person_name, guest_id, upsale_amount, commission_earned, guest_upsale_history_id)
            VALUES (NEW.upsaled_by, NEW.guest_id, upsale_val, upsale_val * 0.10, NEW.id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

-- Step 4: Create triggers to call the logging functions
CREATE TRIGGER on_new_guest_commission_check
AFTER INSERT ON public.guests
FOR EACH ROW EXECUTE FUNCTION public.handle_new_guest_for_commission();

CREATE TRIGGER on_upsale_commission_check
AFTER INSERT ON public.guest_upsale_history
FOR EACH ROW EXECUTE FUNCTION public.handle_upsale_for_commission();

-- Step 5: Backfill historical data
DO $$
DECLARE
    guest_record RECORD;
BEGIN
    -- Clear logs before backfilling
    TRUNCATE TABLE public.referral_commission_log, public.upsale_commission_log RESTART IDENTITY;

    -- Backfill referral commissions
    FOR guest_record IN
        WITH ranked_referrals AS (
            SELECT
                id,
                referrer,
                created_at,
                ROW_NUMBER() OVER(PARTITION BY referrer ORDER BY created_at) as rn
            FROM public.guests
            WHERE referrer IS NOT NULL AND referrer <> ''
        )
        SELECT rr.id, rr.referrer, COALESCE(gr.sponsorship, 0) as sponsorship
        FROM ranked_referrals rr
        JOIN public.guest_revenue gr ON rr.id = gr.guest_id
        WHERE rr.rn > 10 AND COALESCE(gr.sponsorship, 0) > 0
    LOOP
        INSERT INTO public.referral_commission_log (referrer_name, referred_guest_id, sponsorship_amount, commission_earned)
        VALUES (guest_record.referrer, guest_record.id, guest_record.sponsorship, guest_record.sponsorship * 0.10);
    END LOOP;

    -- Backfill upsale commissions
    INSERT INTO public.upsale_commission_log (upsale_person_name, guest_id, upsale_amount, commission_earned, guest_upsale_history_id, created_at)
    SELECT
        upsaled_by,
        guest_id,
        (to_sponsorship - from_sponsorship),
        (to_sponsorship - from_sponsorship) * 0.10,
        id,
        created_at
    FROM public.guest_upsale_history
    WHERE upsaled_by IS NOT NULL AND upsaled_by <> '' AND (to_sponsorship - from_sponsorship) > 0;
END;
$$;

-- Step 6: Create new RPC functions to get summaries from logs
DROP FUNCTION IF EXISTS public.get_commission_summary();
CREATE OR REPLACE FUNCTION public.get_commission_summary()
RETURNS TABLE(referrer_name text, commissionable_referrals_count bigint, total_commissionable_amount numeric, total_commission numeric)
LANGUAGE sql
AS $$
    SELECT
        referrer_name,
        count(*) as commissionable_referrals_count,
        sum(sponsorship_amount) as total_commissionable_amount,
        sum(commission_earned) as total_commission
    FROM public.referral_commission_log
    GROUP BY referrer_name;
$$;

DROP FUNCTION IF EXISTS public.get_upsale_commission_summary();
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
RETURNS TABLE(upsale_person_name text, upsale_count bigint, total_upsale_amount numeric, total_commission numeric)
LANGUAGE sql
AS $$
    SELECT
        upsale_person_name,
        count(*) as upsale_count,
        sum(upsale_amount) as total_upsale_amount,
        sum(commission_earned) as total_commission
    FROM public.upsale_commission_log
    GROUP BY upsale_person_name;
$$;

-- Step 7: Update RPC functions for details view
DROP FUNCTION IF EXISTS public.get_commission_details(text);
CREATE OR REPLACE FUNCTION public.get_commission_details(referrer_name_in text)
RETURNS TABLE(referred_guest_name text, referred_guest_role text, sponsorship_amount numeric, commission_earned numeric, referral_date timestamp with time zone)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.name as referred_guest_name,
        g.role as referred_guest_role,
        rcl.sponsorship_amount,
        rcl.commission_earned,
        rcl.created_at as referral_date
    FROM public.referral_commission_log rcl
    JOIN public.guests g ON rcl.referred_guest_id = g.id
    WHERE rcl.referrer_name = referrer_name_in
    ORDER BY rcl.created_at;
END;
$$;

DROP FUNCTION IF EXISTS public.get_upsale_commission_details(text);
CREATE OR REPLACE FUNCTION public.get_upsale_commission_details(upsaled_by_in text)
RETURNS TABLE(upsaled_guest_name text, upsale_amount numeric, commission_earned numeric, upsale_date timestamp with time zone)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH all_guests AS (
        SELECT id, name FROM public.guests
        UNION ALL
        SELECT id, name FROM public.vip_guests
    )
    SELECT
        g.name as upsaled_guest_name,
        ucl.upsale_amount,
        ucl.commission_earned,
        ucl.created_at as upsale_date
    FROM public.upsale_commission_log ucl
    JOIN all_guests g ON ucl.guest_id = g.id
    WHERE ucl.upsale_person_name = upsaled_by_in
    ORDER BY ucl.created_at;
END;
$$;
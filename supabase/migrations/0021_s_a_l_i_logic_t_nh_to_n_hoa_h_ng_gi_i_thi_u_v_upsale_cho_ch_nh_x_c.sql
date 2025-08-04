-- Step 1: Truncate logs to clear out previously incorrect data
TRUNCATE TABLE public.referral_commission_log, public.upsale_commission_log RESTART IDENTITY;

-- Step 2: Backfill referral commissions with the corrected logic (using initial sponsorship amount)
DO $$
DECLARE
    guest_record RECORD;
    initial_sponsorship NUMERIC;
BEGIN
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
        SELECT rr.id, rr.referrer
        FROM ranked_referrals rr
        WHERE rr.rn > 10
    LOOP
        -- Determine the correct initial sponsorship amount by checking upsale history first
        SELECT COALESCE(
            (SELECT from_sponsorship FROM public.guest_upsale_history WHERE guest_id = guest_record.id ORDER BY created_at ASC LIMIT 1),
            (SELECT sponsorship FROM public.guest_revenue WHERE guest_id = guest_record.id)
        ) INTO initial_sponsorship;

        IF initial_sponsorship IS NOT NULL AND initial_sponsorship > 0 THEN
            INSERT INTO public.referral_commission_log (referrer_name, referred_guest_id, sponsorship_amount, commission_earned)
            VALUES (guest_record.referrer, guest_record.id, initial_sponsorship, initial_sponsorship * 0.10);
        END IF;
    END LOOP;
END;
$$;

-- Step 3: Backfill upsale commissions (this logic was correct but re-running for consistency)
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
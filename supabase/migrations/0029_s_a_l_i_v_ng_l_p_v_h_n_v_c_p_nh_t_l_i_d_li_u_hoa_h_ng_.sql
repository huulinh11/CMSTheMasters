-- Step 1: Break the recursive loop by redefining the summary function WITHOUT the UPDATE statement.
-- This new version also ensures ALL sales staff are included, even those with zero commissions.
CREATE OR REPLACE FUNCTION public.refresh_upsale_commission_summary()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Rebuild the summary table with the corrected logic
    TRUNCATE TABLE public.upsale_commission_summary;

    INSERT INTO public.upsale_commission_summary (user_id, upsale_person_name, upsale_count, total_upsale_amount, total_commission, updated_at)
    WITH commission_data AS (
        -- Aggregate commission data from the log
        SELECT
            ucl.upsaled_by_user_id,
            count(*) as upsale_count,
            sum(ucl.upsale_amount) as total_upsale_amount,
            sum(ucl.commission_earned) as total_commission
        FROM public.upsale_commission_log ucl
        WHERE ucl.upsaled_by_user_id IS NOT NULL
        GROUP BY ucl.upsaled_by_user_id
    )
    -- Start with all 'Sale' profiles and LEFT JOIN commission data
    SELECT
        p.id as user_id,
        p.full_name as upsale_person_name,
        COALESCE(cd.upsale_count, 0),
        COALESCE(cd.total_upsale_amount, 0),
        COALESCE(cd.total_commission, 0),
        now()
    FROM public.profiles p
    LEFT JOIN commission_data cd ON p.id = cd.upsaled_by_user_id
    WHERE p.role = 'Sale';
END;
$function$;

-- Step 2: Now that the loop is broken, safely backfill the missing user_id for historical records.
-- This will trigger the new, safe function.
UPDATE public.upsale_commission_log ucl
SET upsaled_by_user_id = p.id
FROM public.profiles p
WHERE lower(trim(ucl.upsale_person_name)) = lower(trim(p.full_name))
  AND ucl.upsaled_by_user_id IS NULL;

-- Step 3: Force one final recalculation to ensure the summary table is perfectly in sync.
SELECT public.refresh_upsale_commission_summary();
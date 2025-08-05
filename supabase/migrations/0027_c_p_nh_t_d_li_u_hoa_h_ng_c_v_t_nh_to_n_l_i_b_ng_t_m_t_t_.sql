-- Step 1: Backfill the missing user_id for historical records in the commission log
UPDATE public.upsale_commission_log ucl
SET upsaled_by_user_id = p.id
FROM public.profiles p
WHERE lower(trim(ucl.upsale_person_name)) = lower(trim(p.full_name))
  AND ucl.upsaled_by_user_id IS NULL;

-- Step 2: Force a recalculation of the summary table with the corrected historical data
SELECT public.refresh_upsale_commission_summary();
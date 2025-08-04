-- Step 1: Update the refresh function for upsale summary to be more robust
CREATE OR REPLACE FUNCTION public.refresh_upsale_commission_summary()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    TRUNCATE TABLE public.upsale_commission_summary;
    INSERT INTO public.upsale_commission_summary (upsale_person_name, upsale_count, total_upsale_amount, total_commission, updated_at)
    SELECT
        p.full_name AS upsale_person_name,
        COALESCE(ucl.upsale_count, 0) AS upsale_count,
        COALESCE(ucl.total_upsale_amount, 0) AS total_upsale_amount,
        COALESCE(ucl.total_commission, 0) AS total_commission,
        now()
    FROM
        public.profiles p
    LEFT JOIN (
        SELECT
            -- Normalize the name for a more reliable join
            lower(trim(upsale_person_name)) as person_key,
            -- Keep the original name for display
            upsale_person_name,
            count(*) as upsale_count,
            sum(upsale_amount) as total_upsale_amount,
            sum(commission_earned) as total_commission
        FROM public.upsale_commission_log
        GROUP BY upsale_person_name
    ) ucl ON lower(trim(p.full_name)) = ucl.person_key
    WHERE p.role = 'Sale';
END;
$$;

-- Step 2: Re-run the refresh to apply the fix
SELECT refresh_upsale_commission_summary();
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
RETURNS TABLE(upsale_person_name text, upsale_count bigint, total_upsale_amount numeric, total_commission numeric)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.full_name AS upsale_person_name,
        COALESCE(ucl.upsale_count, 0) AS upsale_count,
        COALESCE(ucl.total_upsale_amount, 0) AS total_upsale_amount,
        COALESCE(ucl.total_commission, 0) AS total_commission
    FROM
        public.profiles p
    LEFT JOIN (
        SELECT
            upsale_person_name,
            count(*) as upsale_count,
            sum(upsale_amount) as total_upsale_amount,
            sum(commission_earned) as total_commission
        FROM public.upsale_commission_log
        GROUP BY upsale_person_name
    ) ucl ON p.full_name = ucl.upsale_person_name
    WHERE
        p.role = 'Sale';
END;
$$;
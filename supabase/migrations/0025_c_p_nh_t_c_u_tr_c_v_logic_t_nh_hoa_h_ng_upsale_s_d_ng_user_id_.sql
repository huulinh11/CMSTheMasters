-- Thêm cột user_id vào bảng tóm tắt hoa hồng để định danh chính xác
ALTER TABLE public.upsale_commission_summary
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Cập nhật hàm để điền user_id và cải thiện logic join
CREATE OR REPLACE FUNCTION public.refresh_upsale_commission_summary()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    TRUNCATE TABLE public.upsale_commission_summary;

    INSERT INTO public.upsale_commission_summary (user_id, upsale_person_name, upsale_count, total_upsale_amount, total_commission, updated_at)
    WITH commission_data AS (
        SELECT
            ucl.upsale_person_name,
            count(*) as upsale_count,
            sum(ucl.upsale_amount) as total_upsale_amount,
            sum(ucl.commission_earned) as total_commission
        FROM public.upsale_commission_log ucl
        GROUP BY ucl.upsale_person_name
    )
    SELECT
        p.id as user_id,
        p.full_name as upsale_person_name,
        COALESCE(cd.upsale_count, 0),
        COALESCE(cd.total_upsale_amount, 0),
        COALESCE(cd.total_commission, 0),
        now()
    FROM public.profiles p
    LEFT JOIN commission_data cd ON lower(trim(p.full_name)) = lower(trim(cd.upsale_person_name))
    WHERE p.role = 'Sale';
END;
$function$
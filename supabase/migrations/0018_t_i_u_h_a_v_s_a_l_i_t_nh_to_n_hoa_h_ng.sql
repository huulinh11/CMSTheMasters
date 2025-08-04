-- Step 1: Create summary tables to store pre-calculated commission data
CREATE TABLE public.referral_commission_summary (
  referrer_name TEXT PRIMARY KEY,
  commissionable_referrals_count BIGINT,
  total_commissionable_amount NUMERIC,
  total_commission NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referral_commission_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public referral_commission_summary are viewable by everyone." ON public.referral_commission_summary FOR SELECT USING (true);
CREATE POLICY "Admins can manage referral_commission_summary" ON public.referral_commission_summary FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý') );

CREATE TABLE public.upsale_commission_summary (
  upsale_person_name TEXT PRIMARY KEY,
  upsale_count BIGINT,
  total_upsale_amount NUMERIC,
  total_commission NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.upsale_commission_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public upsale_commission_summary are viewable by everyone." ON public.upsale_commission_summary FOR SELECT USING (true);
CREATE POLICY "Admins can manage upsale_commission_summary" ON public.upsale_commission_summary FOR ALL USING ( (SELECT role FROM profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý') );

-- Step 2: Update the get_upsale_commission_summary function to fix the bug
CREATE OR REPLACE FUNCTION public.get_upsale_commission_summary()
 RETURNS TABLE(upsale_person_name text, upsale_count bigint, total_upsale_amount numeric, total_commission numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    WITH aggregated_upsales AS (
        SELECT
            lower(trim(guh.upsaled_by)) AS upsaled_by_clean,
            trim(guh.upsaled_by) as original_upsaled_by,
            count(*) AS upsale_count,
            sum(guh.to_sponsorship - guh.from_sponsorship) AS total_upsale_amount,
            sum(guh.to_sponsorship - guh.from_sponsorship) * 0.10 AS total_commission
        FROM public.guest_upsale_history guh
        WHERE guh.upsaled_by IS NOT NULL AND trim(guh.upsaled_by) <> '' AND (guh.to_sponsorship - guh.from_sponsorship) > 0
        GROUP BY upsaled_by_clean, original_upsaled_by
    ),
    all_sales_people AS (
        SELECT lower(trim(p.full_name)) as person_key, p.full_name as display_name
        FROM public.profiles p
        WHERE p.role = 'Sale'
    )
    SELECT
        COALESCE(asp.display_name, au.original_upsaled_by) AS upsale_person_name,
        COALESCE(au.upsale_count, 0) AS upsale_count,
        COALESCE(au.total_upsale_amount, 0) AS total_upsale_amount,
        COALESCE(au.total_commission, 0) AS total_commission
    FROM all_sales_people asp
    FULL OUTER JOIN aggregated_upsales au ON asp.person_key = au.upsaled_by_clean
    WHERE COALESCE(asp.display_name, au.original_upsaled_by) IS NOT NULL;
END;
$function$;

-- Step 3: Create refresh functions to populate the summary tables
CREATE OR REPLACE FUNCTION public.refresh_referral_commission_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    CREATE TEMP TABLE temp_summary AS
    SELECT * FROM public.get_commission_summary();

    TRUNCATE TABLE public.referral_commission_summary;
    INSERT INTO public.referral_commission_summary (referrer_name, commissionable_referrals_count, total_commissionable_amount, total_commission, updated_at)
    SELECT ts.referrer_name, ts.commissionable_referrals_count, ts.total_commissionable_amount, ts.total_commission, now()
    FROM temp_summary ts;

    DROP TABLE temp_summary;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_upsale_commission_summary()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    CREATE TEMP TABLE temp_summary AS
    SELECT * FROM public.get_upsale_commission_summary();

    TRUNCATE TABLE public.upsale_commission_summary;
    INSERT INTO public.upsale_commission_summary (upsale_person_name, upsale_count, total_upsale_amount, total_commission, updated_at)
    SELECT ts.upsale_person_name, ts.upsale_count, ts.total_upsale_amount, ts.total_commission, now()
    FROM temp_summary ts;

    DROP TABLE temp_summary;
END;
$$;

-- Step 4: Create triggers to automatically update summary tables when data changes
CREATE OR REPLACE FUNCTION trigger_refresh_referral_commission()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_referral_commission_summary();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_guest_change ON public.guests;
CREATE TRIGGER on_guest_change
AFTER INSERT OR UPDATE OR DELETE ON public.guests
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_referral_commission();

DROP TRIGGER IF EXISTS on_guest_revenue_change ON public.guest_revenue;
CREATE TRIGGER on_guest_revenue_change
AFTER INSERT OR UPDATE OR DELETE ON public.guest_revenue
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_referral_commission();

DROP TRIGGER IF EXISTS on_guest_upsale_history_change_for_referral ON public.guest_upsale_history;
CREATE TRIGGER on_guest_upsale_history_change_for_referral
AFTER INSERT OR UPDATE OR DELETE ON public.guest_upsale_history
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_referral_commission();

CREATE OR REPLACE FUNCTION trigger_refresh_upsale_commission()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_upsale_commission_summary();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_guest_upsale_history_change_for_upsale ON public.guest_upsale_history;
CREATE TRIGGER on_guest_upsale_history_change_for_upsale
AFTER INSERT OR UPDATE OR DELETE ON public.guest_upsale_history
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_upsale_commission();

DROP TRIGGER IF EXISTS on_profiles_change_for_upsale ON public.profiles;
CREATE TRIGGER on_profiles_change_for_upsale
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_upsale_commission();

-- Step 5: Initial data population
SELECT refresh_referral_commission_summary();
SELECT refresh_upsale_commission_summary();
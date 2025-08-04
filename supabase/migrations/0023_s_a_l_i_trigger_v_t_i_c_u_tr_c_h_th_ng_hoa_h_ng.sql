-- Step 1: Re-create the summary tables for pre-calculated data
DROP TABLE IF EXISTS public.referral_commission_summary CASCADE;
DROP TABLE IF EXISTS public.upsale_commission_summary CASCADE;

CREATE TABLE public.referral_commission_summary (
  referrer_name TEXT PRIMARY KEY,
  commissionable_referrals_count BIGINT,
  total_commissionable_amount NUMERIC,
  total_commission NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referral_commission_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to referral_commission_summary" ON public.referral_commission_summary FOR ALL USING (true);

CREATE TABLE public.upsale_commission_summary (
  upsale_person_name TEXT PRIMARY KEY,
  upsale_count BIGINT,
  total_upsale_amount NUMERIC,
  total_commission NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.upsale_commission_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to upsale_commission_summary" ON public.upsale_commission_summary FOR ALL USING (true);

-- Step 2: Create robust functions to refresh these summary tables
CREATE OR REPLACE FUNCTION public.refresh_referral_commission_summary()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
    TRUNCATE TABLE public.referral_commission_summary;
    INSERT INTO public.referral_commission_summary (referrer_name, commissionable_referrals_count, total_commissionable_amount, total_commission, updated_at)
    SELECT
        referrer_name,
        count(*) as commissionable_referrals_count,
        sum(sponsorship_amount) as total_commissionable_amount,
        sum(commission_earned) as total_commission,
        now()
    FROM public.referral_commission_log
    GROUP BY referrer_name;
END;
$$;

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
            upsale_person_name,
            count(*) as upsale_count,
            sum(upsale_amount) as total_upsale_amount,
            sum(commission_earned) as total_commission
        FROM public.upsale_commission_log
        GROUP BY upsale_person_name
    ) ucl ON p.full_name = ucl.upsale_person_name
    WHERE p.role = 'Sale';
END;
$$;

-- Step 3: Set up triggers to keep summary tables automatically updated
-- Trigger for referral summary
DROP TRIGGER IF EXISTS on_referral_log_change ON public.referral_commission_log;
CREATE OR REPLACE FUNCTION trigger_refresh_referral_summary() RETURNS TRIGGER AS $$ BEGIN PERFORM refresh_referral_commission_summary(); RETURN NULL; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_referral_log_change AFTER INSERT OR UPDATE OR DELETE ON public.referral_commission_log FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_referral_summary();

-- Triggers for upsale summary
DROP TRIGGER IF EXISTS on_upsale_log_change ON public.upsale_commission_log;
DROP TRIGGER IF EXISTS on_profiles_change_for_upsale_summary ON public.profiles;

-- Trigger function for upsale_commission_log (statement level)
CREATE OR REPLACE FUNCTION trigger_refresh_upsale_summary_statement() RETURNS TRIGGER AS $$ BEGIN PERFORM refresh_upsale_commission_summary(); RETURN NULL; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER on_upsale_log_change AFTER INSERT OR UPDATE OR DELETE ON public.upsale_commission_log FOR EACH STATEMENT EXECUTE FUNCTION trigger_refresh_upsale_summary_statement();

-- Trigger function for profiles (row level)
CREATE OR REPLACE FUNCTION trigger_refresh_upsale_summary_row()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        IF OLD.role IS DISTINCT FROM NEW.role AND (OLD.role = 'Sale' OR NEW.role = 'Sale') THEN
            PERFORM refresh_upsale_commission_summary();
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.role = 'Sale' THEN
            PERFORM refresh_upsale_commission_summary();
        END IF;
    ELSIF (TG_OP = 'INSERT') THEN
        IF NEW.role = 'Sale' THEN
            PERFORM refresh_upsale_commission_summary();
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER on_profiles_change_for_upsale_summary AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION trigger_refresh_upsale_summary_row();

-- Step 4: Populate the tables with correct data initially
SELECT refresh_referral_commission_summary();
SELECT refresh_upsale_commission_summary();

-- Step 5: Remove the old slow RPC functions
DROP FUNCTION IF EXISTS public.get_commission_summary();
DROP FUNCTION IF EXISTS public.get_upsale_commission_summary();
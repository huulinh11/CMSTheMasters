-- 1. Create services table
CREATE TABLE public.services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  statuses JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to services" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- 2. Create guest_services table
CREATE TABLE public.guest_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_id TEXT NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  referrer_id TEXT, -- Can be guest ID (text) or user ID (uuid)
  referrer_type TEXT, -- 'guest' or 'sale'
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.guest_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to guest_services" ON public.guest_services FOR ALL USING (true) WITH CHECK (true);

-- 3. Create service_commission_log table
CREATE TABLE public.service_commission_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guest_service_id UUID NOT NULL REFERENCES public.guest_services(id) ON DELETE CASCADE,
  referrer_id TEXT,
  referrer_type TEXT,
  referrer_name TEXT,
  service_price NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL,
  commission_earned NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.service_commission_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to service_commission_log" ON public.service_commission_log FOR ALL USING (true) WITH CHECK (true);

-- 4. Add service_commission_rate to checklist_settings
ALTER TABLE public.checklist_settings
ADD COLUMN IF NOT EXISTS service_commission_rate NUMERIC DEFAULT 0.10; -- Default to 10%

-- 5. Function and Trigger to handle commission logging
CREATE OR REPLACE FUNCTION public.log_service_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    commission_rate_val NUMERIC;
    referrer_name_val TEXT;
BEGIN
    -- Get the commission rate from settings
    SELECT service_commission_rate INTO commission_rate_val FROM public.checklist_settings LIMIT 1;
    IF commission_rate_val IS NULL THEN
        commission_rate_val := 0.10; -- Default if not set
    END IF;

    -- If there is a referrer, log the commission
    IF NEW.referrer_id IS NOT NULL AND NEW.referrer_type IS NOT NULL THEN
        -- Determine referrer name
        IF NEW.referrer_type = 'sale' THEN
            SELECT full_name INTO referrer_name_val FROM public.profiles WHERE id = NEW.referrer_id::uuid;
        ELSIF NEW.referrer_type = 'guest' THEN
            -- Check both guest tables
            SELECT name INTO referrer_name_val FROM public.guests WHERE id = NEW.referrer_id;
            IF referrer_name_val IS NULL THEN
                SELECT name INTO referrer_name_val FROM public.vip_guests WHERE id = NEW.referrer_id;
            END IF;
        END IF;

        -- Insert into the log
        INSERT INTO public.service_commission_log (
            guest_service_id,
            referrer_id,
            referrer_type,
            referrer_name,
            service_price,
            commission_rate,
            commission_earned
        )
        VALUES (
            NEW.id,
            NEW.referrer_id,
            NEW.referrer_type,
            referrer_name_val,
            NEW.price,
            commission_rate_val,
            NEW.price * commission_rate_val
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_guest_service ON public.guest_services;
CREATE TRIGGER on_new_guest_service
AFTER INSERT ON public.guest_services
FOR EACH ROW
EXECUTE FUNCTION public.log_service_commission();

-- 6. RPC to get guest service details
CREATE OR REPLACE FUNCTION public.get_guest_service_details()
RETURNS TABLE(
    id uuid,
    guest_id text,
    guest_name text,
    guest_phone text,
    guest_type text,
    service_id uuid,
    service_name text,
    price numeric,
    paid_amount numeric,
    unpaid_amount numeric,
    referrer_id text,
    referrer_type text,
    referrer_name text,
    status text,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH all_guests AS (
        SELECT id, name, phone, 'Chức vụ' as type FROM public.vip_guests
        UNION ALL
        SELECT id, name, phone, 'Khách mời' as type FROM public.guests
    ),
    all_referrers AS (
        SELECT id::text, full_name as name FROM public.profiles
        UNION ALL
        SELECT id, name FROM all_guests
    )
    SELECT
        gs.id,
        gs.guest_id,
        g.name as guest_name,
        g.phone as guest_phone,
        g.type as guest_type,
        gs.service_id,
        s.name as service_name,
        gs.price,
        gs.paid_amount,
        (gs.price - gs.paid_amount) as unpaid_amount,
        gs.referrer_id,
        gs.referrer_type,
        ar.name as referrer_name,
        gs.status,
        gs.created_at
    FROM public.guest_services gs
    JOIN public.services s ON gs.service_id = s.id
    JOIN all_guests g ON gs.guest_id = g.id
    LEFT JOIN all_referrers ar ON gs.referrer_id = ar.id
    ORDER BY gs.created_at DESC;
END;
$$;

-- 7. RPC for service commission summary
CREATE OR REPLACE FUNCTION public.get_service_commission_summary()
RETURNS TABLE(
    referrer_id text,
    referrer_type text,
    referrer_name text,
    service_count bigint,
    total_service_price numeric,
    total_commission numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        scl.referrer_id,
        scl.referrer_type,
        scl.referrer_name,
        count(*) as service_count,
        sum(scl.service_price) as total_service_price,
        sum(scl.commission_earned) as total_commission
    FROM public.service_commission_log scl
    WHERE scl.referrer_id IS NOT NULL
    GROUP BY scl.referrer_id, scl.referrer_type, scl.referrer_name;
END;
$$;

-- 8. RPC for service commission details
CREATE OR REPLACE FUNCTION public.get_service_commission_details(referrer_id_in text)
RETURNS TABLE(
    guest_name text,
    service_name text,
    service_price numeric,
    commission_earned numeric,
    sale_date timestamp with time zone
)
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
        g.name as guest_name,
        s.name as service_name,
        scl.service_price,
        scl.commission_earned,
        scl.created_at as sale_date
    FROM public.service_commission_log scl
    JOIN public.guest_services gs ON scl.guest_service_id = gs.id
    JOIN public.services s ON gs.service_id = s.id
    JOIN all_guests g ON gs.guest_id = g.id
    WHERE scl.referrer_id = referrer_id_in
    ORDER BY scl.created_at DESC;
END;
$$;
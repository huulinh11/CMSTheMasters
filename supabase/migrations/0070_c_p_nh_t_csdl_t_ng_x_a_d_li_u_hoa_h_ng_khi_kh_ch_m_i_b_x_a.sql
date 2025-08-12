-- Step 1: Create a comprehensive function to handle guest deletion and cascade deletes
CREATE OR REPLACE FUNCTION public.handle_deleted_guest()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete related records that don't have a direct foreign key with cascade
  DELETE FROM public.guest_services WHERE guest_id = OLD.id;
  DELETE FROM public.guest_upsale_history WHERE guest_id = OLD.id;
  DELETE FROM public.referral_commission_log WHERE referred_guest_id = OLD.id;
  RETURN OLD;
END;
$$;

-- Step 2: Create/replace triggers on guests and vip_guests tables
DROP TRIGGER IF EXISTS on_guest_deleted ON public.guests;
CREATE TRIGGER on_guest_deleted
  AFTER DELETE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_guest();

DROP TRIGGER IF EXISTS on_vip_guest_deleted ON public.vip_guests;
CREATE TRIGGER on_vip_guest_deleted
  AFTER DELETE ON public.vip_guests
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_guest();

-- Step 3: Ensure cascading deletes are set up for related tables

-- For service_commission_log (depends on guest_services)
ALTER TABLE public.service_commission_log
DROP CONSTRAINT IF EXISTS service_commission_log_guest_service_id_fkey;

ALTER TABLE public.service_commission_log
ADD CONSTRAINT service_commission_log_guest_service_id_fkey
FOREIGN KEY (guest_service_id)
REFERENCES public.guest_services(id)
ON DELETE CASCADE;

-- For service_payments (depends on guest_services)
ALTER TABLE public.service_payments
DROP CONSTRAINT IF EXISTS service_payments_guest_service_id_fkey;

ALTER TABLE public.service_payments
ADD CONSTRAINT service_payments_guest_service_id_fkey
FOREIGN KEY (guest_service_id)
REFERENCES public.guest_services(id)
ON DELETE CASCADE;

-- For guest_service_event_log (depends on guest_services)
ALTER TABLE public.guest_service_event_log
DROP CONSTRAINT IF EXISTS guest_service_event_log_guest_service_id_fkey;

ALTER TABLE public.guest_service_event_log
ADD CONSTRAINT guest_service_event_log_guest_service_id_fkey
FOREIGN KEY (guest_service_id)
REFERENCES public.guest_services(id)
ON DELETE CASCADE;

-- For upsale_commission_log (depends on guest_upsale_history)
ALTER TABLE public.upsale_commission_log
DROP CONSTRAINT IF EXISTS upsale_commission_log_guest_upsale_history_id_fkey;

ALTER TABLE public.upsale_commission_log
ADD CONSTRAINT upsale_commission_log_guest_upsale_history_id_fkey
FOREIGN KEY (guest_upsale_history_id)
REFERENCES public.guest_upsale_history(id)
ON DELETE CASCADE;
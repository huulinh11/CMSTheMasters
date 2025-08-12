-- Add ON DELETE CASCADE to service_payments
ALTER TABLE public.service_payments DROP CONSTRAINT IF EXISTS service_payments_guest_service_id_fkey;
ALTER TABLE public.service_payments ADD CONSTRAINT service_payments_guest_service_id_fkey FOREIGN KEY (guest_service_id) REFERENCES public.guest_services(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to service_commission_log
ALTER TABLE public.service_commission_log DROP CONSTRAINT IF EXISTS service_commission_log_guest_service_id_fkey;
ALTER TABLE public.service_commission_log ADD CONSTRAINT service_commission_log_guest_service_id_fkey FOREIGN KEY (guest_service_id) REFERENCES public.guest_services(id) ON DELETE CASCADE;

-- Add ON DELETE CASCADE to guest_service_event_log
ALTER TABLE public.guest_service_event_log DROP CONSTRAINT IF EXISTS guest_service_event_log_guest_service_id_fkey;
ALTER TABLE public.guest_service_event_log ADD CONSTRAINT guest_service_event_log_guest_service_id_fkey FOREIGN KEY (guest_service_id) REFERENCES public.guest_services(id) ON DELETE CASCADE;
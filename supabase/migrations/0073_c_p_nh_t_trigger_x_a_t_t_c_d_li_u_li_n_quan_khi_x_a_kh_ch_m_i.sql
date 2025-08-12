CREATE OR REPLACE FUNCTION public.handle_deleted_guest()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Delete related records that don't have a direct foreign key with cascade
  DELETE FROM public.guest_services WHERE guest_id = OLD.id;
  DELETE FROM public.guest_upsale_history WHERE guest_id = OLD.id;
  DELETE FROM public.referral_commission_log WHERE referred_guest_id = OLD.id;
  DELETE FROM public.media_benefits WHERE guest_id = OLD.id;
  DELETE FROM public.guest_tasks WHERE guest_id = OLD.id;
  DELETE FROM public.guest_task_history WHERE guest_id = OLD.id;
  RETURN OLD;
END;
$function$
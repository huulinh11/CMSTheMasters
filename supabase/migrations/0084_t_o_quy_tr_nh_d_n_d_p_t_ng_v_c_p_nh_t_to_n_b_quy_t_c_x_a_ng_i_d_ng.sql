-- Step 1: Create a function to handle cleanup before a profile is deleted.
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Set related user IDs to NULL in history tables to preserve records without a link.
  UPDATE public.guest_upsale_history
  SET upsaled_by_user_id = NULL
  WHERE upsaled_by_user_id = OLD.id;

  UPDATE public.upsale_commission_log
  SET upsaled_by_user_id = NULL
  WHERE upsaled_by_user_id = OLD.id;

  -- Delete the summary row for the user.
  DELETE FROM public.upsale_commission_summary
  WHERE user_id = OLD.id;

  RETURN OLD;
END;
$$;

-- Step 2: Create a trigger to run this function BEFORE a profile is deleted.
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
CREATE TRIGGER on_profile_deleted
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_profile();

-- Step 3: Remove the old, conflicting trigger that runs on DELETE.
DROP TRIGGER IF EXISTS on_profiles_change_for_upsale_summary ON public.profiles;

-- Step 4: Re-configure foreign keys to ensure they don't conflict with the new trigger.
-- The trigger now handles the logic, so these constraints are just for data integrity.
ALTER TABLE public.guest_upsale_history DROP CONSTRAINT IF EXISTS guest_upsale_history_upsaled_by_user_id_fkey;
ALTER TABLE public.guest_upsale_history
ADD CONSTRAINT guest_upsale_history_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.upsale_commission_log DROP CONSTRAINT IF EXISTS upsale_commission_log_upsaled_by_user_id_fkey;
ALTER TABLE public.upsale_commission_log
ADD CONSTRAINT upsale_commission_log_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE NO ACTION;

ALTER TABLE public.upsale_commission_summary DROP CONSTRAINT IF EXISTS upsale_commission_summary_user_id_fkey;
ALTER TABLE public.upsale_commission_summary
ADD CONSTRAINT upsale_commission_summary_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE NO ACTION;
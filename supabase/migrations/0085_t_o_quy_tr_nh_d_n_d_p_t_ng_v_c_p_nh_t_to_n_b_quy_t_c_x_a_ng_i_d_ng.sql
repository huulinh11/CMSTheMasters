-- Step 1: Define the cleanup function that runs BEFORE a profile is deleted.
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- For history tables, set the user ID to NULL to preserve the record without a link.
    UPDATE public.guest_upsale_history
    SET upsaled_by_user_id = NULL
    WHERE upsaled_by_user_id = OLD.id;

    UPDATE public.upsale_commission_log
    SET upsaled_by_user_id = NULL
    WHERE upsaled_by_user_id = OLD.id;

    -- For the summary table, the record for the deleted user is no longer needed.
    DELETE FROM public.upsale_commission_summary
    WHERE user_id = OLD.id;

    -- Allow the original DELETE operation to proceed.
    RETURN OLD;
END;
$$;

-- Step 2: Drop all existing triggers on the profiles table to ensure a clean slate.
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
DROP TRIGGER IF EXISTS on_profiles_change_for_upsale_summary ON public.profiles;
DROP TRIGGER IF EXISTS trigger_refresh_upsale_summary_row ON public.profiles;


-- Step 3: Create the new trigger that calls our cleanup function BEFORE a delete occurs.
CREATE TRIGGER on_profile_deleted
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_profile();

-- Step 4: Re-create the trigger for INSERT/UPDATE, ensuring it does NOT run on DELETE.
CREATE TRIGGER on_profiles_change_for_upsale_summary
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_upsale_summary_row();

-- Step 5: Set all foreign keys to ON DELETE NO ACTION, as the trigger now handles the logic.
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
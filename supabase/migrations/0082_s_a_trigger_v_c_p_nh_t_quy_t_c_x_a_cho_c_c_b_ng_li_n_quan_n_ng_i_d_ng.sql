-- Step 1: Drop the existing trigger completely to avoid conflicts.
DROP TRIGGER IF EXISTS on_profiles_change_for_upsale_summary ON public.profiles;

-- Step 2: Re-create the trigger, but ONLY for INSERT and UPDATE events.
-- This prevents the trigger from firing on DELETE and conflicting with foreign key actions.
CREATE TRIGGER on_profiles_change_for_upsale_summary
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trigger_refresh_upsale_summary_row();

-- Step 3: Ensure foreign key constraints are correctly configured.

-- For the summary table, when a user is deleted, their summary row is also deleted.
ALTER TABLE public.upsale_commission_summary DROP CONSTRAINT IF EXISTS upsale_commission_summary_user_id_fkey;
ALTER TABLE public.upsale_commission_summary
ADD CONSTRAINT upsale_commission_summary_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- For history tables, when a user is deleted, the reference is set to NULL to preserve the record.
ALTER TABLE public.guest_upsale_history DROP CONSTRAINT IF EXISTS guest_upsale_history_upsaled_by_user_id_fkey;
ALTER TABLE public.guest_upsale_history
ADD CONSTRAINT guest_upsale_history_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.upsale_commission_log DROP CONSTRAINT IF EXISTS upsale_commission_log_upsaled_by_user_id_fkey;
ALTER TABLE public.upsale_commission_log
ADD CONSTRAINT upsale_commission_log_upsaled_by_user_id_fkey
FOREIGN KEY (upsaled_by_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
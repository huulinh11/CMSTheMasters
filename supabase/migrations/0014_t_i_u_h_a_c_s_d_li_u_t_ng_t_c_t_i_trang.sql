CREATE INDEX IF NOT EXISTS idx_guests_referrer ON public.guests (referrer);
CREATE INDEX IF NOT EXISTS idx_guest_upsale_history_guest_id ON public.guest_upsale_history (guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_upsale_history_upsaled_by_lower_trim ON public.guest_upsale_history (lower(trim(upsaled_by)));
CREATE INDEX IF NOT EXISTS idx_profiles_role_full_name_lower_trim ON public.profiles (role, lower(trim(full_name)));